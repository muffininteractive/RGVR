# Configuração de Desenvolvimento A-Frame + Vite

## Comandos Rápidos

```bash
# Iniciar desenvolvimento
npm run dev

# Build produção
npm run build

# Testar build
npm run preview
```

## URLs de Desenvolvimento

- **Local**: http://localhost:3000
- **Network**: http://[IP]:3000

## Estrutura para Vite

```
src/
├── index.html          # Entry point
├── css/
│   └── style.css       # Styles
├── js/  
│   └── main.js         # JavaScript modules
├── assets/             # Static assets
│   ├── models/         # 3D models (.glb, .gltf)
│   ├── textures/       # Textures (.jpg, .png)
│   └── sounds/         # Audio files
└── public/             # Public assets (copied as-is)
```

## Hot Reload

O Vite detecta automaticamente mudanças em:
- ✅ HTML files
- ✅ CSS files  
- ✅ JavaScript files
- ✅ Assets (with full reload)

## Debug Tips

1. **Console**: Use `console.log()` - não é removido em dev
2. **Network**: Acesse via IP para teste mobile
3. **HTTPS**: Mude `https: true` no vite.config.js para WebXR
4. **Performance**: Monitor FPS no canto da tela

## Build Otimizações

- **Minification**: Terser
- **Tree shaking**: Remove código não usado  
- **Asset optimization**: Compressão automática
- **Source maps**: Para debugging em produção