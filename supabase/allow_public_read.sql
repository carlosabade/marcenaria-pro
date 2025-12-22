
-- 1. Permite LEITURA (Visualizar) para qualquer projeto que tenha um token público gerado
-- Isso é necessário para quem acessa o link conseguir ver os dados
create policy "Public View Project by Token"
on projects
for select
to anon
using (public_token is not null);

-- 2. Permite LEITURA do perfil da empresa (para mostrar logo, telefone, cor)
create policy "Public View Company Profiles"
on profiles
for select
to anon
using (true); -- Permite ver perfis públicos (necessário para o branding)
