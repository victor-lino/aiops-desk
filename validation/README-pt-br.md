# Validação

[🇺🇸 Read in English](README.md)

Evidências de que os principais fluxos funcionam de ponta a ponta,
reunidas durante o desenvolvimento. Nenhum hostname, IP ou credencial do
laboratório é reproduzido aqui — cada item descreve o teste realizado e o
resultado, não os detalhes do ambiente.

## Login LDAP

- **Teste**: login pela tela de Login do frontend usando credenciais
  reais de uma conta do domínio.
- **Resultado**: o backend faz o bind com sucesso contra o controlador de
  domínio via LDAP, emite um token de sessão, e o frontend abre na Visão
  Geral com o nome do analista exibido. Confirmado funcionando após
  resolver a exigência de assinatura LDAP (ver
  [troubleshooting/05](../troubleshooting/05-ldap-signing-required-pt-br.md)).

## Fluxo público "abrir ticket"

- **Teste**: enviar o formulário público de ticket sem estar logado.
- **Resultado**: um novo ticket é criado com `origem = manual`, visível
  para os analistas na tela de Tickets, sem exigir que o usuário final se
  autentique.

## Webhook do Zabbix → ticket

- **Teste**: enviar um alerta simulado do Zabbix para `POST
  /webhooks/zabbix` (autenticado com o segredo compartilhado) usando um
  cliente REST.
- **Resultado**: um ticket é criado automaticamente com `origem =
  zabbix`, `zabbix_eventid` preenchido, e `sugestao_ia` /
  `prioridade_ia` preenchidos pela IA.

## Rede de segurança do poller

- **Teste**: deixar o poller rodar por vários ciclos de 60 segundos
  contra o mesmo problema ativo do Zabbix, sem chamada de webhook.
- **Resultado**: exatamente um ticket é criado para o problema — sem
  duplicatas entre os ciclos, confirmando que a lógica de deduplicação via
  `zabbix_eventid` funciona (ver
  [troubleshooting/02](../troubleshooting/02-duplicate-tickets-from-poller-pt-br.md)).

## E-mail de ticket + links de resolução

- **Teste**: disparar um e-mail de sugestão de ticket e clicar nos links
  `resolvido` / `nao_resolvido`.
- **Resultado**: e-mail HTML estilizado entregue via SMTP, e os dois
  links de resolução carregam uma página de confirmação estilizada e
  atualizam corretamente o status do ticket.

## Destaque de SLA

- **Teste**: deixar um ticket crítico e sem responsável aberto além do
  limite de 30 minutos.
- **Resultado**: o ticket recebe um badge "SLA ESTOURADO" e um fundo
  vermelho pulsante, recalculado a cada minuto.

## Unificação da autenticação

- **Teste**: chamar `GET /tickets` depois de unificar num único esquema
  `HTTPBearer`.
- **Resultado**: retorna consistentemente `200 OK` com os dados
  esperados do ticket, incluindo os campos gerados pela IA — sem mais
  401/422 intermitentes (ver
  [troubleshooting/04](../troubleshooting/04-conflicting-auth-schemes-pt-br.md)).
