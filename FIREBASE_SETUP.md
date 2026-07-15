# Firebase — configuração manual

O código já está preparado para Firebase Authentication e Cloud Firestore. Ainda é necessário criar e vincular o projeto Firebase, pois essas ações dependem da conta proprietária da CNM.

## 1. Criar e vincular o projeto

1. Crie um projeto em [Firebase Console](https://console.firebase.google.com/) e registre um aplicativo **Web**.
2. Em **Configurações do projeto > Seus apps**, copie o objeto de configuração Web para `firebase-config.js`, substituindo todos os valores `SUBSTITUA`.
3. Em **Authentication > Sign-in method**, habilite apenas **E-mail/senha**. Não habilite cadastro público na interface.
4. Em **Firestore Database**, crie um banco em modo de produção.

## 2. Primeiro administrador

1. Em **Authentication > Users**, crie o usuário administrador com e-mail e senha.
2. Copie o UID desse usuário.
3. Em Firestore, crie a coleção `admins`, com um documento cujo ID seja exatamente o UID copiado e o campo booleano `active: true`.
4. Acesse `login.html` e entre com essa conta. Uma conta autenticada sem esse documento não acessa o painel.

## 3. Publicar regras e hospedagem

Com Node.js instalado, na raiz do repositório execute:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

O arquivo `firebase.json` já aponta para a raiz do site e `firestore.rules` já impede gravações de qualquer pessoa que não seja um administrador ativo. Antes de publicar, confira que `firebase-config.js` contém o projeto correto.

Se o site for hospedado fora do Firebase Hosting, adicione o domínio em **Authentication > Settings > Authorized domains**. Mantenha também `localhost` durante o desenvolvimento local.

## Dados que o painel cria

| Coleção | Papel |
| --- | --- |
| `news` | Chamadas publicadas no carrossel da landing page. |
| `races` | Etapas do calendário, data/hora e estado. |
| `teams` | Equipes que compõem o grid. |
| `drivers` | Pilotos e sua equipe. |
| `results` | Resultado por etapa; cada entrada guarda `driverId`, posição e pontos. |
| `admins` | Lista de usuários autorizados. Não é gerenciada pelo painel. |

A classificação não é salva nem editada: a landing soma os pontos das entradas em `results`, associa cada piloto ao grid e ordena o resultado. Assim, corrigir um resultado atualiza a tabela automaticamente.

## Operação diária

1. Cadastre equipes e pilotos na aba **Grid**.
2. Cadastre as etapas em **Calendário**.
3. Ao terminar uma corrida, use os IDs mostrados na lista de pilotos para lançar as linhas em **Resultados** no formato `id-do-piloto, posição, pontos`.
4. Publique as chamadas na aba **Notícias**.

Os documentos Firestore são públicos somente para leitura; a escrita exige login e o documento `admins/{uid}` ativo. A configuração Web do Firebase não é segredo. A proteção do banco está nas regras e na lista de administradores.
