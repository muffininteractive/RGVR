# 📖 Level Editor - Guia de Uso

## ⚙️ Instalação Inicial

Antes de usar o editor, certifique-se de instalar todas as dependências:

```bash
npm install
```

Isso vai instalar:

- `bulma` - Framework CSS (backend)
- `@fortawesome/fontawesome-free` - Ícones (backend)
- `express` - Servidor backend
- `concurrently` - Para rodar múltiplos scripts
- `vite` - Servidor de desenvolvimento

**Nota:** Bulma e Font Awesome são servidos via CDN na página para compatibilidade com Vite.

## 🚀 Como Usar

### Opção 1: Script Automático (Mais Fácil) ⭐

```bash
./start-editor.sh
```

Ou no Windows:

```bash
npm run editor
```

### Opção 2: Rodar Tudo Junto (Recomendado)

```bash
npm run editor
```

Isso vai rodar simultaneamente:

- **Vite** (servidor de desenvolvimento) na porta 3000
- **Servidor de API** na porta 3001

### Opção 3: Rodar Separadamente

Terminal 1 - Servidor Vite:

```bash
npm run dev
```

Terminal 2 - Servidor de API:

```bash
npm run server
```

## 📝 Acessar o Editor

1. Abra o navegador e acesse: **http://localhost:3000/scenes/level-editor.html**
2. Aguarde carregar os dados
3. Clique em um nível para começar a editar

## ✨ Funcionalidades

### Editar Níveis

- ✏️ Nome, descrição, objetivo e dificuldade
- 🎯 Adicionar/remover/editar elementos

### Editar Elementos

Para cada elemento você pode customizar:

- **ID** - Identificador único
- **Tipo** - sphere, cube, ramp, platform, domino, cylinder, lever
- **Posição** - X, Y, Z
- **Rotação** - X, Y, Z (em graus)
- **Dimensões** - Largura, Altura, Profundidade
- **Raio** - Para esferas
- **Cor** - Com seletor visual
- **Propriedades** - Movível, É Início, É Alvo

### Salvamento

- 💾 **Salvar** - Salva direto no arquivo `data/levels-data.json` + backup automático
- 📥 **Download** - Baixa o JSON para edição externa
- 📋 **Backups** - Visualiza e restaura backups automáticos

## 📁 Estrutura de Arquivos

```
/data/
  ├── levels-data.json                    # Arquivo principal
  └── levels-data.backup.*.json          # Backups automáticos
/scenes/
  └── level-editor.html                   # Editor visual
server.js                                 # Servidor de API
```

## 🔄 Sistema de Backups

- Cada vez que você salva, um backup automático é criado
- Os backups são nomeados com timestamp
- Você pode restaurar qualquer backup anterior

## ⚠️ Troubleshooting

### "Erro ao carregar os dados"

- Certifique-se que o servidor está rodando: `npm run server`
- Verifique se a porta 3001 não está em uso

### "Erro ao salvar"

- Confirme que o servidor API está rodando
- Verifique os logs do terminal
- Tente usar "Download JSON" como alternativa

### CORS Error

- O servidor permite CORS automaticamente
- Se ainda tiver problemas, reinicie o servidor

## 💡 Dicas

1. **Edição em tempo real** - O JSON é atualizado enquanto você digita
2. **Validação de cor** - Use o seletor visual para cores válidas
3. **Backups** - Sempre há um backup antes de qualquer salvamento
4. **Download** - Use para editar com outro editor e importar depois

## 🎮 Voltar ao Jogo

Clique no botão "Voltar" no canto superior direito para voltar ao `index.html`

---

**Desenvolvido com ❤️ usando Bulma + Express**
