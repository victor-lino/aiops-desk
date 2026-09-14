# Decisões Técnicas

[🇺🇸 Read in English](README.md)

Um registro das decisões não óbvias tomadas durante a construção do AIOps
Desk, e por quê.

## Webhook + polling, não só webhook

O Zabbix envia alertas para `POST /webhooks/zabbix` em tempo real, o que
cobre o caso comum. Mas uma chamada de webhook pode se perder (instabilidade
de rede, reinício do backend no momento errado), e um alerta perdido virar
um ticket perdido não é aceitável numa ferramenta de operações. Um poller
em background checa o Zabbix a cada 60 segundos como rede de segurança,
usando `zabbix_eventid` para evitar criar um segundo ticket para um
problema que o webhook já tratou. Os dois mecanismos são redundantes de
propósito.

## Uma tabela `tickets` só, com campo `origem`, não tabelas separadas

Tickets podem vir de três lugares: um webhook do Zabbix, o poller, ou um
humano (um analista via `/diagnostico`, ou um usuário final via o
formulário público "abrir ticket"). Em vez de modelar cada origem como sua
própria tabela, todos escrevem numa única tabela `tickets` com um campo
`origem` (`zabbix`, `manual`, etc.). Isso mantém o painel, a lógica de
SLA e o pipeline de sugestões de IA agnósticos quanto à origem — eles
funcionam da mesma forma independente de onde o ticket veio, e adicionar
uma nova origem depois não exige mexer em cada funcionalidade downstream.

## Aposentar Chamados/Histórico em favor de Tickets

O projeto originalmente tinha um fluxo separado de Chamados/Histórico,
alimentado só por `/diagnostico` e `/zabbix/diagnosticar/{eventid}`. Ele
não tinha rastreamento de status, prioridade ou resolução — diferente de
Tickets, que tinha. Uma vez que Tickets cobria tudo que Chamados fazia e
mais, manter os dois era só estado duplicado sem dono claro de qual era o
"atual". Tickets virou a fonte única de verdade, e Chamados/Histórico foi
aposentado.

## Tela de Diagnóstico não cria ticket

No início, o fluxo `/diagnostico` gerava um diagnóstico de IA *e*
persistia um ticket. Isso misturava duas intenções diferentes: "me ajude a
entender o que está acontecendo" vs. "abra algo que precisa ser
rastreado e resolvido". Diagnóstico agora só produz uma sugestão — nunca
escreve em Tickets. Abrir um ticket é trabalho exclusivo do fluxo "Abrir
ticket" (formulário público ou ação explícita do analista).

## `HTTPBearer` em vez de `OAuth2PasswordBearer`

O backend originalmente tinha os dois — `HTTPBearer` no `main.py`,
`OAuth2PasswordBearer` no `tickets.py` — o que causava comportamento
inconsistente de 401/422 no Swagger dependendo de qual router atendia a
requisição (ver
[troubleshooting/04](../troubleshooting/04-conflicting-auth-schemes-pt-br.md)).
`OAuth2PasswordBearer` é construído em torno do fluxo OAuth2 de
password-grant, que não mapeia bem para "fazer login contra o AD, depois
usar um bearer token" — então a aplicação padronizou em `HTTPBearer`
simples em todo lugar.

## Credenciais no corpo da requisição, não em query parameters

`/login` originalmente aceitava usuário/senha como query parameters, o
que significava que podiam acabar em logs de acesso por padrão. Mudado
para o corpo da requisição (JSON) — ver
[troubleshooting/06](../troubleshooting/06-credentials-leaking-into-logs-pt-br.md).

## Correção no nível de GPO para assinatura LDAP, não um ajuste local no registro

`LDAPServerIntegrity` foi originalmente configurado localmente, mas a
Group Policy continuava sobrescrevendo de volta a cada ciclo de
atualização. A correção precisou acontecer no nível da GPO (Default
Domain Controllers Policy) para realmente se manter — ver
[troubleshooting/05](../troubleshooting/05-ldap-signing-required-pt-br.md).
