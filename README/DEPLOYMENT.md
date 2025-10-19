# 📦 Guia de Build e Deployment - Wacky Works VR

## Visão Geral

Este projeto usa **Vite** para build e pode ser publicado em várias plataformas:

- **Vercel** (recomendado - serverless)
- **GitHub Pages** (gratuito)
- **Netlify**
- **Cualquier host estático**

---

## 🚀 Preparação Local

### Pré-requisitos

- Node.js >= 16.0.0
- npm >= 8.0.0

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
# Inicia servidor de desenvolvimento com HTTPS
npm run dev

# Inicia editor e servidor simultâneamente
npm run editor
```

---

## 🔨 Build

### Build Padrão

```bash
npm run build
```

Isso vai:

1. ✅ Fazer build de todas as páginas (index.html, level.html, level-select.html, etc.)
2. ✅ Minificar e otimizar assets
3. ✅ Gerar sitemap.xml automaticamente
4. ✅ Criar pasta `dist/` pronta para publicação

### Build em Watch Mode

```bash
npm run build:watch
```

Para desenvolvimento contínuo com rebuild automático.

### Limpeza

```bash
npm run clean
```

Remove `dist/` e cache do Vite.

---

## 📊 Estrutura de Build

```
dist/
├── index.html                    # Página principal
├── scenes/
│   ├── level.html               # Página de jogo
│   ├── level-select.html        # Seleção de níveis
│   ├── level-editor.html        # Editor de níveis
│   └── physics-demo.html        # Demo de física
├── assets/
│   ├── flame-*.png              # Imagens
│   ├── style-*.css              # Estilos
│   └── level-editor-*.css       # Estilos do editor
├── chunks/
│   ├── modulepreload-*.js       # Polyfills
│   └── level-ui-components-*.js # Componentes compartilhados
├── level-select.js              # Script entry point
├── level.js                     # Script entry point
├── level-editor.js              # Script entry point
└── sitemap.xml                  # Mapa do site para SEO
```

---

## 🌐 Deployment - Vercel

### Método 1: Conectar via GitHub (Recomendado)

1. **Fazer push para GitHub**

   ```bash
   git push origin game
   ```

2. **Criar Vercel Project**
   - Acesse https://vercel.com
   - Clique em "New Project"
   - Selecione o repositório `RGVR`
   - Configure:
     - Framework: `Vite`
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Deploy Automático**
   - A cada push na branch `main`, o Vercel faz deploy automático

### Método 2: CLI Deploy

1. **Instalar Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Deploy**

   ```bash
   npm run deploy:vercel
   ```

3. **Variáveis de Ambiente (Vercel Dashboard)**
   Adicione em Settings → Environment Variables:
   ```
   VITE_APP_URL=https://seu-dominio.vercel.app
   ```

---

## 🐙 Deployment - GitHub Pages

### Setup Inicial

1. **Ativar GitHub Pages no repositório**
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / root

2. **Instalar gh-pages**

   ```bash
   npm install --save-dev gh-pages
   ```

3. **Deploy Manual**

   ```bash
   npm run deploy:github
   ```

4. **Deploy Automático (GitHub Actions)**
   - Arquivo `.github/workflows/deploy.yml` já configurado
   - A cada push na branch `game`, GitHub Pages faz deploy automático

---

## 📝 CI/CD - GitHub Actions

O projeto possui workflow automático configurado em `.github/workflows/deploy.yml`

### Triggers

- **Push** em `main` → Vercel
- **Push** em `game` → GitHub Pages
- **Pull Requests** → Build de teste

### Variáveis Secretas Necessárias (GitHub Settings → Secrets)

Para Vercel:

```
VERCEL_TOKEN=<seu-token-vercel>
VERCEL_ORG_ID=<seu-org-id>
VERCEL_PROJECT_ID=<seu-project-id>
```

Para GitHub Pages:

```
# (Não é necessário, usa token automático do GitHub)
```

---

## 🔍 Preview

### Local Preview

```bash
npm run preview
# ou
npm run serve
```

Acessa http://localhost:4000 ou 3000

### Preview no Vercel

- Cada commit recebe um Preview URL
- Veja em GitHub → Deployments

---

## 📊 Otimizações Aplicadas

✅ **Minificação com Terser**

- Reduz tamanho do bundle em ~60%

✅ **Code Splitting**

- Componentes compartilhados em chunk separado
- Reduz downloads em navegações repetidas

✅ **Assets Otimizados**

- Imagens com hash para cache eterno
- CSS e JS com contenthash

✅ **Sourcemaps Desativadas em Produção**

- Reduz tamanho do deployment
- (Ativar se precisar de debug)

✅ **Base Path Configurável**

- Suporta tanto `/` como subdiretórios

---

## 🚨 Troubleshooting

### Build falha com erro de SSL

```bash
# Se certificados SSL estiverem faltando em desenvolvimento
npm run clean
npm install
```

### Sitemap não gerado

```bash
# Executar manualmente
node scripts/generate-sitemap.js
```

### Vercel deployment falha

1. Verificar logs: `vercel logs`
2. Testar build localmente: `npm run build`
3. Verificar variáveis de ambiente

### GitHub Actions falha

1. Verificar secrets configurados
2. Logs em GitHub → Actions
3. Testar build localmente

---

## 📈 Performance Checklist

- [ ] Build completa sem warnings
- [ ] Todos os assets minificados
- [ ] Sitemap gerado
- [ ] HTTPS ativado
- [ ] Cache headers configurados
- [ ] Lazy loading de recursos

---

## 🔗 Links Úteis

- [Vite Docs](https://vitejs.dev/)
- [Vercel Docs](https://vercel.com/docs)
- [A-Frame Docs](https://aframe.io/docs/)
- [GitHub Pages](https://pages.github.com/)

---

## 📝 Comandos Rápidos

| Comando                 | Descrição                          |
| ----------------------- | ---------------------------------- |
| `npm run dev`           | Inicia servidor de desenvolvimento |
| `npm run build`         | Build para produção                |
| `npm run preview`       | Preview da build                   |
| `npm run clean`         | Remove dist e cache                |
| `npm run deploy:vercel` | Deploy no Vercel                   |
| `npm run deploy:github` | Deploy no GitHub Pages             |
| `npm run lint`          | Lint do código                     |
| `npm run format`        | Format do código                   |

---

**Última atualização**: 18 de Outubro de 2025
