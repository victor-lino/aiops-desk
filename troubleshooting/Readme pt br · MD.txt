# Registro de Troubleshooting

Bugs reais encontrados e corrigidos durante a construção do AIOps Desk —
mantidos aqui como registro do processo de debug, não só do resultado
final.

| # | Problema | Área |
|---|----------|------|
| [01](01-timezone-naive-vs-aware-pt-br.md) | Horários errados nos tickets (naive vs. aware datetimes) | Backend / models |
| [02](02-duplicate-tickets-from-poller-pt-br.md) | Poller podia criar tickets duplicados para o mesmo problema do Zabbix | Backend / poller |
| [03](03-uuid-vs-integer-id-mismatch-pt-br.md) | Erro de tipo ao inserir em `chamados` (id integer vs UUID) | Banco de dados |
| [04](04-conflicting-auth-schemes-pt-br.md) | Erros 401 / 422 por dois esquemas de autenticação conflitantes | Backend / auth |
| [05](05-ldap-signing-required-pt-br.md) | Login LDAP falhando com `strongerAuthRequired` | Active Directory |
| [06](06-credentials-leaking-into-logs-pt-br.md) | Credenciais de login expostas via query parameters | Segurança |
| [07](07-email-links-timeout-base-url-pt-br.md) | Links de resolução no e-mail de ticket dando timeout | Rede / e-mail |
| [08](08-wrong-ad-server-ip-in-env-pt-br.md) | Chamadas LDAP falhando por IP errado no `.env` | Configuração |
| [09](09-port-conflict-docker-and-local-pt-br.md) | Conflito de portas rodando Docker Compose e dev local juntos | DevOps |
| [10](10-missing-dotenv-and-lost-model-pt-br.md) | Servidor não subia: `load_dotenv()` faltando + classe de modelo perdida | Backend |
| [11](11-zabbix-empty-host-list-permissions-pt-br.md) | `host.get` do Zabbix retornando lista de hosts vazia | Zabbix / permissões |


