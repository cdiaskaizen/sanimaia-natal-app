// Sem login — acesso aberto a toda a gente, como pedido. Fica aqui uma
// função só para manter a mesma forma que o resto da app espera (compatível
// com um futuro login, se algum dia for preciso restringir o acesso).
export async function requireSession() {
  return { user: { email: "publico@sanimaia.pt" } };
}
