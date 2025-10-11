# Projeto A-Frame - RGVR

Um projeto base de Realidade Virtual/Aumentada usando A-Frame, uma framework web para criar experiências VR/AR.

## 🚀 Características

- **Cena 3D Interativa**: Objetos 3D com animações e interações
- **Suporte VR/AR**: Compatível com headsets VR (Oculus, HTC Vive, etc.)
- **Controles Responsivos**: Suporte para desktop, mobile e VR
- **Interface Moderna**: UI overlay com controles e informações
- **Performance Monitor**: Contador de FPS em tempo real
- **Interações Avançadas**: Clique, hover e manipulação de objetos

## 📁 Estrutura do Projeto

```
RGVR/
├── index.html          # Arquivo principal HTML
├── css/
│   └── style.css       # Estilos da interface
├── js/
│   └── main.js         # Lógica da aplicação
├── assets/             # Recursos (texturas, modelos, sons)
└── README.md           # Este arquivo
```

## 🎮 Controles

### Desktop
- **WASD** - Mover pela cena
- **Mouse** - Olhar ao redor
- **Espaço** - Adicionar objeto aleatório
- **R** - Reset da posição da câmera
- **C** - Mudar cor de fundo
- **V** - Entrar/sair do modo VR
- **F** - Fullscreen
- **Clique** - Interagir com objetos

### VR
- **Controles de mão** - Laser pointers para interação
- **Movimento da cabeça** - Navegação natural
- **Gatilhos** - Selecionar e manipular objetos

### Mobile
- **Toque** - Olhar ao redor
- **Botões na tela** - Controles principais

## 🛠️ Como Executar

### 🚀 Opção Recomendada: Vite (Desenvolvimento)
```bash
# Navegue até a pasta do projeto
cd /Users/hugoeuzebio/Sites/LAB/RGVR

# Instale as dependências (primeira vez)
npm install

# Inicie o servidor de desenvolvimento
npm run dev

# OU use o script automatizado
./dev.mjs
```

**Vantagens do Vite:**
- ⚡ **Hot Reload** - Atualizações instantâneas
- 📱 **Acesso remoto** - Teste em dispositivos móveis
- 🔧 **Dev Tools** - Ferramentas de desenvolvimento integradas
- 📦 **Build otimizado** - Para produção

### 🏗️ Build para Produção
```bash
# Gerar build otimizado
npm run build

# Testar build localmente
npm run preview
```

### 📱 Desenvolvimento Mobile/VR
```bash
# O Vite expõe automaticamente na rede local
# Acesse pelo IP mostrado no terminal:
# http://192.168.x.x:3000
```

### 🔧 Outras Opções (Alternativas)

#### Opção 2: Servidor Local Simples
```bash
# Python 3
python -m http.server 8000

# Node.js (se tiver npx)
npx serve .

# PHP  
php -S localhost:8000
```

#### Opção 3: Live Server (VS Code)
1. Instale a extensão "Live Server" no VS Code
2. Clique com botão direito em `index.html`
3. Selecione "Open with Live Server"

## 🌐 Acessando a Aplicação

### Desenvolvimento (Vite):
- **Desktop**: `http://localhost:3000`
- **Mobile/VR**: `http://[seu-ip]:3000`

### Produção/Outros:
- **Desktop**: `http://localhost:8000`
- **Mobile**: `http://[seu-ip]:8000`
- **VR**: Use o mesmo endereço no navegador VR

## 🔧 Personalização

### Adicionando Objetos
```html
<!-- No index.html, dentro de <a-scene> -->
<a-box position="0 1 -3" 
       color="#4CC3D9" 
       class="interactive"
       animation="property: rotation; to: 360 0 0; loop: true; dur: 2000">
</a-box>
```

### Modificando Materiais
```html
<a-sphere position="2 1.25 -5" 
          material="color: red; metalness: 0.5; roughness: 0.1"
          shadow="cast: true; receive: true">
</a-sphere>
```

### Adicionando Texturas
```html
<!-- Em <a-assets> -->
<img id="minhTextura" src="assets/textura.jpg">

<!-- No objeto -->
<a-plane src="#minhaTextura"></a-plane>
```

### Configurando Iluminação
```html
<a-light type="directional" 
         position="5 10 5" 
         color="#ffffff" 
         intensity="0.8"
         castShadow="true">
</a-light>
```

## 🎨 Customizando CSS

O arquivo `css/style.css` contém:
- Estilos da interface overlay
- Animações CSS
- Responsividade mobile
- Temas de cores

## ⚙️ JavaScript Avançado

O arquivo `js/main.js` inclui:
- Gerenciamento de eventos
- Sistema de interações
- Monitor de performance
- Utilitários diversos
- Controles VR/AR

### Adicionando Funcionalidades
```javascript
// Exemplo: Nova interação personalizada
eventManager.on('object:click', (data) => {
    console.log('Objeto clicado:', data.object);
    // Sua lógica aqui
});

// Exemplo: Criar novo tipo de objeto
function criarObjetoCustom() {
    const obj = Utils.createElement('a-dodecahedron', {
        position: '0 2 -3',
        color: Utils.randomColor(),
        class: 'interactive'
    });
    
    scene.appendChild(obj);
}
```

## ⚡ Comandos Vite

### Scripts Disponíveis
```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview

# Servir na porta 3000
npm run serve

# Limpeza de cache e dependências
npm run clean

# Formatação de código
npm run format

# Linting (verificação de código)
npm run lint
```

### Script Automatizado
```bash
# Executa instalação + desenvolvimento automaticamente
./dev.mjs

# OU (caso não seja executável)
node dev.mjs
```

### Configurações do Vite

O arquivo `vite.config.js` inclui:
- **Hot Reload** para CSS, JS e assets
- **HTTPS** opcional para WebXR
- **Acesso de rede** para testes mobile
- **Build otimizado** com Terser
- **Source maps** para debug
- **Aliases** para imports limpos

### Variáveis de Ambiente
```bash
# Desenvolvimento
NODE_ENV=development npm run dev

# Produção
NODE_ENV=production npm run build

# Debug habilitado
DEBUG=true npm run dev
```

### Deploy
```bash
# Build e deploy simples
npm run build
# Copie a pasta 'dist/' para seu servidor

# Preview local do build
npm run preview
```

## 📱 Suporte a Dispositivos

### VR Headsets
- **Oculus Quest/Quest 2** - Suporte completo
- **HTC Vive** - Suporte completo
- **PlayStation VR** - Suporte básico
- **Cardboard** - Suporte mobile

### Navegadores
- **Chrome** - Recomendado (WebXR)
- **Firefox** - Suporte WebVR/WebXR
- **Edge** - Suporte WebXR
- **Safari** - Suporte limitado

### Dispositivos Mobile
- **Android** - Chrome/Firefox
- **iOS** - Safari (limitado)

## 🔍 Debug e Desenvolvimento

### Console de Debug
Abra as ferramentas de desenvolvedor (F12) para:
- Ver logs da aplicação
- Monitorar performance
- Debuggar interações
- Inspecionar objetos 3D

### Inspetor A-Frame
- Pressione `Ctrl + Alt + I` para abrir o inspetor
- Visualize e edite objetos em tempo real
- Ajuste propriedades visualmente

### Variáveis Globais de Debug
```javascript
// Disponível no console do navegador
window.AFrameApp.CONFIG.DEBUG = true;
window.AFrameApp.Utils.log('Mensagem de debug');
```

## 📚 Recursos Adicionais

### Documentação
- [A-Frame Docs](https://aframe.io/docs/)
- [A-Frame School](https://aframe.io/aframe-school/)
- [A-Frame Examples](https://aframe.io/examples/)

### Componentes Úteis
- [A-Frame Environment](https://github.com/supermedium/aframe-environment-component)
- [A-Frame Physics](https://github.com/donmccurdy/aframe-physics-system)
- [A-Frame Particle System](https://github.com/IdeaSpaceVR/aframe-particle-system-component)

### Assets Gratuitos
- [Poly by Google](https://poly.google.com/)
- [Sketchfab](https://sketchfab.com/)
- [A-Frame Registry](https://aframe.io/aframe-registry/)

## 🚨 Solução de Problemas

### Problema: Cena não carrega
- Verifique se está usando um servidor HTTP
- Confirme se o A-Frame CDN está acessível
- Verifique o console por erros JavaScript

### Problema: VR não funciona
- Use HTTPS (necessário para WebXR)
- Verifique compatibilidade do navegador
- Teste em dispositivo/headset compatível

### Problema: Performance baixa
- Reduza número de objetos na cena
- Otimize texturas (tamanho/formato)
- Use LOD (Level of Detail) para objetos distantes
- Monitore FPS no contador

### Problema: Mobile não responsivo
- Verifique viewport meta tag
- Teste orientação de tela
- Ajuste controles touch

## 📄 Licença

Este projeto é de código aberto e pode ser usado livremente para fins educacionais e comerciais.

## 🤝 Contribuições

Sinta-se à vontade para:
- Reportar bugs
- Sugerir melhorias
- Adicionar novas funcionalidades
- Otimizar performance

---

**Desenvolvido para experimentação com Realidade Virtual na Web** 🥽✨