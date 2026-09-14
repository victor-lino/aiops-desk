# Bug: Chamadas LDAP falhando por causa de um IP errado no `.env`

## Sintoma
Requisições que dependiam de LDAP falhavam de forma intermitente, parecendo
um problema de conectividade, mesmo com o controlador de domínio no ar.

## Causa raiz
`AD_SERVER` no `.env` do backend estava configurado com o IP interno
errado — um erro de digitação de um único dígito do endereço real do
controlador de domínio na rede do laboratório.

## Correção
Corrigido `AD_SERVER` no `.env` para o endereço real do controlador de
domínio.

## Lição
Um único dígito errado num IP é um dos bugs mais difíceis de perceber lendo
o código, porque o código em si está completamente correto — o erro só
aparece como sintoma de rede. Vale conferir os IPs de infraestrutura contra
a fonte real deles (a configuração da VM/host) em vez de confiar na
memória ao debugar problemas de conectividade.
