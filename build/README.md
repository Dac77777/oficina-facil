# OficinaFácil Gratuito

Este é o build do aplicativo OficinaFácil Gratuito, pronto para ser publicado no GitHub Pages ou Vercel.

## Arquivos Necessários

Todos os arquivos necessários para o funcionamento do aplicativo como PWA já estão presentes na raiz da pasta build:

- `favicon.ico` (ícone do site)
- `logo192.png` (ícone para dispositivos móveis)
- `logo512.png` (ícone para tela inicial e splash screen)

Estes arquivos são essenciais para o funcionamento correto do PWA e já estão posicionados na raiz da pasta build, no mesmo nível que o arquivo index.html.

## Configuração para Vercel

Para resolver o problema da página em branco no Vercel, foram adicionados os seguintes arquivos:

1. `vercel.json` - Configura o Vercel para redirecionar todas as rotas para o index.html
2. `.nojekyll` - Evita que o GitHub Pages processe o site como um projeto Jekyll
3. `_redirects` - Configura redirecionamentos para o Netlify e outros serviços

Além disso, o `manifest.json` foi atualizado para usar caminhos absolutos com o prefixo `/oficina-facil/`.

### Instruções para deploy no Vercel

1. Faça upload de todo o conteúdo da pasta `build` para o repositório GitHub
2. Conecte o repositório ao Vercel
3. Configure as seguintes opções no Vercel:
   - Framework Preset: Other
   - Build Command: (deixe em branco)
   - Output Directory: ./
   - Install Command: (deixe em branco)

Se a página ainda estiver em branco após o deploy, verifique o console do navegador para identificar possíveis erros de carregamento de recursos.

## Observações

- O aplicativo está configurado para funcionar na rota `/oficina-facil/`
- Todos os arquivos necessários já estão presentes e prontos para publicação
- O aplicativo funcionará como PWA e poderá ser instalado em dispositivos móveis e desktops