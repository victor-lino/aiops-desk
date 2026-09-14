# Integração com Monitoramento

[🇺🇸 Read in English](README.md)

Como o AIOps Desk se integra com o Zabbix.

## Endpoints

- `GET /zabbix/problemas` — lista os problemas ativos atuais do Zabbix.
- `POST /zabbix/diagnosticar/{eventid}` — roda o diagnóstico de IA
  (`diagnosticar()`) sobre um problema específico do Zabbix e salva o
  resultado.
- `POST /webhooks/zabbix` — recebe um alerta em tempo real enviado pelo
  Zabbix e cria um ticket. Autenticado via header `x-webhook-secret`, cujo
  valor é um segredo compartilhado configurado tanto no media type de
  webhook do Zabbix quanto nas variáveis de ambiente do backend — nunca
  commitado no repositório (ver `.env.example`).

## Como um problema do Zabbix vira ticket

Dois mecanismos independentes alimentam a mesma tabela `tickets`:

1. **Webhook** — o media type do Zabbix chama `POST /webhooks/zabbix` no
   momento em que um problema dispara. Caminho mais rápido, mas depende do
   Zabbix conseguir alcançar o backend naquele instante.
2. **Poller** — uma tarefa em background (`asyncio.create_task`, iniciada
   no startup do FastAPI) consulta `host.get` / `problem.get` na API do
   Zabbix a cada 60 segundos e cria um ticket para qualquer problema ativo
   que ainda não tenha um, comparado pelo `zabbix_eventid`. Existe
   puramente como rede de segurança para chamadas de webhook perdidas.

## Mapeamento de severidade → prioridade

A severidade do problema no Zabbix é mapeada para o campo `prioridade` do
ticket quando um ticket é criado a partir de um evento do Zabbix, então os
analistas veem uma escala de prioridade consistente, venha o ticket do
Zabbix ou de um humano. A IA (`sugerir_resolucao()`) também pode sugerir
uma prioridade com base na descrição do problema, armazenada ao lado —
não no lugar — do valor derivado do Zabbix.

## Configuração necessária do lado do Zabbix

- Um usuário de API do Zabbix (referido aqui como usuário "aiops-api") com
  permissão de leitura sobre os grupos de hosts que você quer que o AIOps
  Desk veja. Sem isso, `host.get` / `problem.get` retornam resultados
  vazios mesmo com hosts e problemas existindo — ver
  [troubleshooting/11](../troubleshooting/11-zabbix-empty-host-list-permissions-pt-br.md).
- Um media type de webhook apontando para o endpoint
  `/webhooks/zabbix` do seu backend, enviando o segredo compartilhado no
  header `x-webhook-secret`.

## Configuração

Todos os detalhes de conexão com o Zabbix (URL da API, credenciais,
segredo do webhook) são lidos de variáveis de ambiente — veja o
`.env.example` na raiz do projeto para a lista completa de chaves.
Nenhum desses valores é commitado no repositório.
