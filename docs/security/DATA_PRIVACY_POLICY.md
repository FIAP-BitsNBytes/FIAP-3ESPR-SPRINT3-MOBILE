# Política de Privacidade e Sigilo Médico-Paciente (NutriApp)

## 1. Visão Geral e Compromisso
Este documento estabelece as diretrizes técnicas e operacionais para garantir o sigilo absoluto das informações de saúde no NutriApp. A plataforma foi desenhada sob o princípio de **Privacy by Design**, garantindo que a confidencialidade médico-paciente seja inviolável.

## 2. Implementação do Sigilo (Isolamento Técnico)

### A. Row-Level Security (RLS) - O "Cofre" do Banco de Dados
A segurança não depende apenas do código do aplicativo (Frontend), mas é forçada diretamente no banco de dados PostgreSQL através de políticas de RLS:
- **Isolamento de Paciente:** Um paciente tem acesso estritamente aos seus próprios dados. É tecnicamente impossível (via banco) que o Paciente A visualize qualquer registro do Paciente B.
- **Privilégio Médico-Paciente:** Um médico/nutricionista só pode visualizar dados de pacientes que estão explicitamente vinculados ao seu ID. O sistema bloqueia qualquer tentativa de um médico acessar registros de pacientes de outros profissionais.

### B. Exclusão Administrativa (Zero-Access Admin)
Diferente de sistemas comuns, o perfil **ADMIN** no NutriApp:
- Possui permissão apenas para gestão de infraestrutura e usuários (aprovação de novos médicos).
- É **explicitamente proibido** de ler tabelas de `meal_logs` (refeições) e `evolution_logs` (bioimpedância/clínico).
- Esta regra é forçada via RLS no banco de dados, garantindo que nem mesmo um administrador do sistema possa vazar dados sensíveis.

### C. Propriedade Direta e Rastreabilidade
Para maximizar a performance e a segurança:
- **Vínculo Médico Mandatário:** Todas as tabelas de saúde (`meal_logs`, `evolution_logs`) contêm obrigatoriamente a coluna `nutritionist_id`. Isso permite que o banco valide o acesso instantaneamente sem necessidade de cruzamento de dados complexos.
- **Rastreio de Auditoria de Linha:** Cada registro no sistema possui metadados de auditoria:
    - `created_at` / `updated_at`: Carimbo de tempo de todas as ações.
    - `created_by` / `updated_by`: Identificação do usuário responsável por cada inserção ou modificação.

## 3. Protocolos de Segurança de Dados

| Camada | Tecnologia | Objetivo |
|---|---|---|
| **Trânsito** | HTTPS/SSL TLS 1.3 | Criptografia de ponta a ponta em todas as requisições. |
| **Autenticação** | Supabase Auth (JWT) | Tokens seguros com expiração e renovação controlada. |
| **Autorização** | PostgreSQL RLS | Garantia de que o usuário só acessa o que é dono ou autorizado. |
| **Banco de Dados** | AES-256 (At rest) | Dados criptografados fisicamente nos servidores do Supabase. |

## 4. Auditoria e Conformidade
- **Migrations:** Todas as mudanças estruturais e de permissões são registradas em arquivos SQL imutáveis e datados em `supabase/migrations/`.
- **Logs de Acesso:** Tentativas de acesso não autorizado a dados de outros pacientes são registradas para auditoria.
- **Relatórios de Auditoria:** Ao final de cada funcionalidade, é gerado um relatório de auditoria detalhando as políticas de segurança aplicadas àquela feature.

## 5. Responsabilidade Técnica
Qualquer modificação no esquema de dados que afete a privacidade deve ser precedida por uma atualização neste documento e validada contra as políticas de RLS vigentes.
