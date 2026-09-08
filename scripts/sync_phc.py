# -*- coding: utf-8 -*-
"""
Sincronização (leitura) com o SQL Server do PHC da Sanimaia.

Liga-se a 10.0.0.6 (rede interna da Sanimaia), lê a família de artigos de
Natal (familia = '19'), cruza com os fornecedores da ata, e escreve um
snapshot em js/phc-snapshot.json que a app estática lê no browser.

NUNCA escreve nada na base do PHC (só SELECT). As credenciais NÃO ficam neste
ficheiro (que é público no repositório) — vêm de variáveis de ambiente.

Correr manualmente (PowerShell):
    $env:PHC_USER = "Kaizen"
    $env:PHC_PASSWORD = "a-tua-password"
    python scripts/sync_phc.py

Este portátil precisa de estar na rede da Sanimaia (ou VPN) para o 10.0.0.6
ser alcançável.
"""
import json
import os
import sys
from datetime import datetime, date

import pyodbc

SERVER = os.environ.get("PHC_SERVER", "10.0.0.6")
DATABASE = os.environ.get("PHC_DATABASE", "Sanimaia")
USER = os.environ.get("PHC_USER")
PASSWORD = os.environ.get("PHC_PASSWORD")

if not USER or not PASSWORD:
    print("Erro: define PHC_USER e PHC_PASSWORD como variáveis de ambiente antes de correr este script.")
    sys.exit(1)

# Fornecedores identificados na ata -> palavra-chave para procurar em st.fornecedor
ATA_SUPPLIERS = {
    "Andrea Bizzotto": "BIZZOTTO",
    "Nuvole di Stoffa": "NUVOLE",
    "Becky's": "BECKY",
    "Boltze": "BOLTZE",
    "Räder": "R%DER",  # acentos ficam corrompidos na fonte (Räder -> R der)
    "Cartai Bassanesi": "CARTAI",
    "Shishi": "SHISHI",
    "Ellegift": "ELLEGIFT",
    "Vetur": "VETUR",
    "EDG": "EDG",
    "Coopman": "COOPMAN",
    "Royal Christmas / Van der": "ROYAL CHRISTMAS",
    "La Galleria": "GALLERIA",
}

RECEIPT_DOC_TYPES = ("Guia de Entrada", "Recep. de Sede")
SALE_DOC_TYPE = "Encomenda de Cliente"
FAMILY = "19"

OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "js", "phc-snapshot.json")


def connect():
    conn_str = (
        f"DRIVER={{SQL Server}};SERVER={SERVER};DATABASE={DATABASE};"
        f"UID={USER};PWD={PASSWORD};Trusted_Connection=no;Connection Timeout=10;"
    )
    return pyodbc.connect(conn_str)


def supplier_snapshot(cur, keyword):
    cur.execute(
        """
        SELECT COUNT(DISTINCT ref) skus, SUM(stock) stock_atual
        FROM st WHERE familia = ? AND fornecedor LIKE ?
        """,
        FAMILY, f"%{keyword}%",
    )
    row = cur.fetchone()
    skus, stock_atual = (row.skus or 0), float(row.stock_atual or 0)

    placeholders = ",".join("?" for _ in RECEIPT_DOC_TYPES)
    cur.execute(
        f"""
        SELECT ISNULL(SUM(bi.qtt), 0) recebido, MAX(bi.fdata) ultima_data
        FROM bi
        JOIN bo ON bo.bostamp = bi.bostamp
        JOIN st ON st.ref = bi.ref AND st.familia = ?
        WHERE st.fornecedor LIKE ? AND bo.nmdos IN ({placeholders})
          AND bi.fdata >= '2026-01-01'
        """,
        FAMILY, f"%{keyword}%", *RECEIPT_DOC_TYPES,
    )
    row = cur.fetchone()
    recebido_2026 = float(row.recebido or 0)
    ultima_data = row.ultima_data.isoformat() if row.ultima_data else None

    return {
        "skus_familia_natal": skus,
        "stock_atual": stock_atual,
        "recebido_2026": recebido_2026,
        "ultima_receção": ultima_data,
    }


def leftover_2025(cur, limit=40):
    placeholders = ",".join("?" for _ in RECEIPT_DOC_TYPES)
    cur.execute(
        f"""
        WITH compras AS (
            SELECT bi.ref, SUM(bi.qtt) qtt_comprada
            FROM bi JOIN bo ON bo.bostamp = bi.bostamp
            WHERE bo.nmdos IN ({placeholders}) AND bi.fdata BETWEEN '2025-01-01' AND '2025-12-31'
            GROUP BY bi.ref
        ),
        vendas AS (
            SELECT bi.ref, SUM(bi.qtt) qtt_vendida
            FROM bi JOIN bo ON bo.bostamp = bi.bostamp
            WHERE bo.nmdos = ? AND bi.fdata BETWEEN '2025-01-01' AND '2025-12-31'
            GROUP BY bi.ref
        )
        SELECT TOP {limit}
            st.ref, st.design, st.fornecedor,
            ISNULL(c.qtt_comprada, 0) qtt_comprada,
            ISNULL(v.qtt_vendida, 0) qtt_vendida,
            ISNULL(c.qtt_comprada, 0) - ISNULL(v.qtt_vendida, 0) sobra
        FROM st
        LEFT JOIN compras c ON c.ref = st.ref
        LEFT JOIN vendas v ON v.ref = st.ref
        WHERE st.familia = ? AND ISNULL(c.qtt_comprada, 0) > 0
        ORDER BY sobra DESC
        """,
        *RECEIPT_DOC_TYPES, SALE_DOC_TYPE, FAMILY,
    )
    cols = [d[0] for d in cur.description]
    rows = []
    for r in cur.fetchall():
        d = dict(zip(cols, r))
        rows.append({
            "ref": d["ref"].strip() if d["ref"] else "",
            "product": (d["design"] or "").strip(),
            "supplier": (d["fornecedor"] or "").strip(),
            "qty_ordered": float(d["qtt_comprada"] or 0),
            "qty_sold": float(d["qtt_vendida"] or 0),
            "leftover": float(d["sobra"] or 0),
        })
    return rows


def main():
    print(f"A ligar a {SERVER}/{DATABASE}...")
    conn = connect()
    cur = conn.cursor()
    print("Ligado. A recolher dados (só leitura)...")

    suppliers = {}
    for label, keyword in ATA_SUPPLIERS.items():
        try:
            suppliers[label] = supplier_snapshot(cur, keyword)
            print(f"  {label}: {suppliers[label]}")
        except Exception as e:
            print(f"  {label}: ERRO {e}")
            suppliers[label] = {"error": str(e)}

    print("A calcular sobras de stock 2025 (top 40 por família de Natal)...")
    try:
        leftovers = leftover_2025(cur)
        print(f"  {len(leftovers)} artigos encontrados")
    except Exception as e:
        print(f"  ERRO: {e}")
        leftovers = []

    snapshot = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "source": f"PHC SQL Server ({SERVER}/{DATABASE}) — leitura direta, sem escrita",
        "suppliers": suppliers,
        "leftover_2025": leftovers,
    }

    out_path = os.path.abspath(OUT_PATH)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, ensure_ascii=False, indent=2, default=str)
    print(f"\nSnapshot escrito em {out_path}")


if __name__ == "__main__":
    main()
