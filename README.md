Guia de Publicação no GitHub Pages - OficinaFácil Gratuito
Este guia fornece instruções passo a passo para publicar o OficinaFácil Gratuito no GitHub Pages, permitindo que o aplicativo seja acessado online e instalado como PWA em qualquer dispositivo.
Pré-requisitos
Uma conta no GitHub (gratuita)
Git instalado no seu computador (opcional, pois você pode fazer upload direto pelo navegador)
Passo 1: Criar um novo repositório no GitHub
Acesse GitHub e faça login na sua conta
Clique no botão "+" no canto superior direito e selecione "New repository"
Nomeie o repositório como oficina-facil (ou outro nome de sua preferência)
Deixe o repositório como "Public"
Não inicialize o repositório com README, .gitignore ou licença
Clique em "Create repository"
Passo 2: Preparar os arquivos para publicação
Você tem duas opções para publicar os arquivos:
Opção A: Upload direto pelo navegador (mais simples)
Extraia o arquivo build.zip que você recebeu
No seu repositório GitHub recém-criado, clique no link "uploading an existing file"
Arraste todos os arquivos da pasta build extraída para a área de upload
Adicione uma mensagem de commit como "Primeira publicação do OficinaFácil"
Clique em "Commit changes"
Opção B: Usando Git (para usuários avançados)
Extraia o arquivo build.zip que você recebeu
Abra o terminal ou prompt de comando
Navegue até a pasta build extraída
Execute os seguintes comandos:
bash
git init
git add .
git commit -m "Primeira publicação do OficinaFácil"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/oficina-facil.git
git push -u origin main
Substitua SEU-USUARIO pelo seu nome de usuário do GitHub.
Passo 3: Configurar o GitHub Pages
No seu repositório, clique na aba "Settings"
No menu lateral esquerdo, clique em "Pages"
Na seção "Source", selecione "main" como branch
Selecione "/ (root )" como pasta
Clique em "Save"
Aguarde alguns minutos para que o GitHub Pages publique seu site
Passo 4: Criar arquivo CNAME (opcional, para domínio personalizado)
Se você tiver um domínio personalizado e quiser usá-lo:
No seu repositório, clique em "Add file" e depois "Create new file"
Nomeie o arquivo como CNAME (sem extensão)
Adicione seu domínio personalizado (ex: oficinafacil.seudominio.com)
Clique em "Commit new file"
Configure seu provedor de DNS para apontar para o GitHub Pages
Passo 5: Acessar e instalar o PWA
Acesse seu site publicado em https://SEU-USUARIO.github.io/oficina-facil/ (ou seu domínio personalizado )
Para instalar como PWA:
No Chrome/Edge (Android/Windows): Clique no ícone de instalação na barra de endereço
No Safari (iOS/iPadOS): Toque no botão de compartilhamento e selecione "Adicionar à Tela de Início"
No Safari (macOS): Não suporta PWA diretamente, use Chrome
Solução de Problemas
O site mostra "404 Not Found"
Verifique se os arquivos foram carregados corretamente
Confirme se a configuração do GitHub Pages está apontando para a branch e pasta corretas
Aguarde alguns minutos, pois o GitHub Pages pode demorar para atualizar
O PWA não aparece para instalação
Verifique se está usando um navegador compatível (Chrome, Edge, Safari no iOS)
Certifique-se de que o site está totalmente carregado
Tente recarregar a página
Problemas com autenticação Google
Certifique-se de que o domínio do GitHub Pages está autorizado no console do Google Cloud
Adicione https://SEU-USUARIO.github.io como origem autorizada
Atualizações Futuras
Para atualizar o aplicativo no futuro:
Substitua os arquivos no repositório pelos novos
O GitHub Pages atualizará automaticamente o site
Os usuários receberão a atualização na próxima vez que acessarem o aplicativo
Observações Importantes
O GitHub Pages é gratuito para repositórios públicos
Há um limite de 1GB de armazenamento e 100GB de largura de banda por mês
O aplicativo funcionará offline após a primeira instalação
As operações offline serão sincronizadas quando o usuário estiver online novamente
