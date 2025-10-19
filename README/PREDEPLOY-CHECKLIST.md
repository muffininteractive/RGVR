# ✅ Checklist de Pre-Deployment

## Local Verification

- [ ] Todas as dependências instaladas: `npm install`
- [ ] Código lint passou: `npm run lint`
- [ ] Build completa sem erros: `npm run build`
- [ ] Preview rodando normalmente: `npm run preview`
- [ ] Testou em dispositivo mobile (VR se possível)

## GitHub Setup

- [ ] Repositório criado/atualizado
- [ ] Branch `main` existe
- [ ] Branch `game` existe e atualizada
- [ ] `.gitignore` configurado corretamente
- [ ] Arquivo `.github/workflows/deploy.yml` está no lugar

## Vercel Setup

- [ ] Conta Vercel criada
- [ ] Repositório conectado ao Vercel
- [ ] Project criado no Vercel
- [ ] Secrets adicionados em GitHub:
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID`

## GitHub Pages Setup

- [ ] Settings → Pages habilitado
- [ ] Branch `gh-pages` selecionado
- [ ] Domínio customizado (opcional)

## Netlify Setup (Opcional)

- [ ] Conta Netlify criada
- [ ] Repositório conectado
- [ ] `netlify.toml` configurado

## SEO & Performance

- [ ] `sitemap.xml` gerado e funcional
- [ ] `robots.txt` adicionado (opcional)
- [ ] Meta tags em todos os HTML
- [ ] Open Graph tags adicionadas
- [ ] Lighthouse score > 80

## Segurança

- [ ] SSL/HTTPS ativado
- [ ] Headers de segurança configurados
- [ ] CORS configurado corretamente
- [ ] Credenciais removidas do código
- [ ] `.env` não está no git

## Teste de Produção

```bash
# Build local
npm run build

# Verificar tamanho
du -sh dist/

# Listar arquivos gerados
ls -la dist/

# Preview
npm run preview
# Testar em http://localhost:4000
```

## Deploy Steps

### Vercel (Automático)

```bash
git push origin main
# Deploy automático!
```

### GitHub Pages (Automático)

```bash
git push origin game
# Deploy automático!
```

### Manual Deploy

```bash
npm run deploy:vercel
# ou
npm run deploy:github
```

## Post-Deployment

- [ ] Testar URL de produção em desktop
- [ ] Testar URL de produção em mobile
- [ ] Testar VR (se houver dispositivo)
- [ ] Verificar console para erros
- [ ] Validar sitemap.xml
- [ ] Testar todas as páginas:
  - [ ] `/` - Landing
  - [ ] `/scenes/level-select.html` - Seleção
  - [ ] `/scenes/level.html` - Jogo
  - [ ] `/scenes/level-editor.html` - Editor
  - [ ] `/scenes/physics-demo.html` - Demo

## Monitoramento

- [ ] Logs no Vercel/GitHub configurados
- [ ] Alertas configurados para falhas
- [ ] Analytics configurado (opcional)
- [ ] Performance monitored

## Documentação

- [ ] README.md atualizado
- [ ] DEPLOYMENT.md pronto para referência
- [ ] README-BUILD.md pronto para o time
- [ ] EDITOR-README.md atualizado

---

**Data de Check**: ******\_\_******
**Responsável**: ******\_\_******
**Status**: ✅ Pronto / ⚠️ Pendências

---

Observações adicionais:

```
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
```
