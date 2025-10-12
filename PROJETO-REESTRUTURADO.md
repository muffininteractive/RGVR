# RGVR - Sistema Reestruturado

## 📁 Nova Estrutura do Projeto

```
RGVR/
├── scenes/                 # Cenas do jogo
│   ├── tutorial.html      # Cena de tutorial
│   ├── level-select.html  # Seleção de fases
│   └── game.html          # Cena de jogo principal
├── components/            # Componentes A-Frame reutilizáveis
│   ├── base-component.js  # Componente base para objetos
│   ├── cube-component.js  # Componente específico para cubos
│   ├── sphere-component.js # Componente específico para esferas
│   ├── cylinder-component.js # Componente específico para cilindros
│   ├── cone-component.js   # Componente específico para cones
│   └── torus-component.js  # Componente específico para torus
├── data/                  # Dados do jogo
│   └── objects.json       # Definições dos objetos e níveis
├── utils/                 # Utilitários
│   ├── scene-manager.js   # Gerenciador de navegação entre cenas
│   └── level-generator.js # Gerador de níveis baseado no JSON
├── js/                    # Scripts específicos das cenas
│   ├── tutorial.js        # Lógica do tutorial
│   ├── level-select.js    # Lógica da seleção de fases
│   └── game.js            # Lógica principal do jogo
├── css/                   # Estilos
│   └── style.css          # Estilos personalizados
└── index.html             # Ponto de entrada (menu principal)
```

## 🎮 Fluxo de Navegação

1. **index.html** → Menu principal com opções:
   - 🎓 Iniciar Tutorial
   - 🎮 Jogar Agora (vai para seleção de fase)
   - ℹ️ Sobre o Jogo

2. **Tutorial** → Ensina os controles básicos
   - Movimento com WASD/VR
   - Pegar objetos com gatilho
   - Conectar objetos compatíveis
   - Botão para pular ou continuar

3. **Seleção de Fase** → Escolha do nível de dificuldade
   - Fácil (3 objetos)
   - Médio (5 objetos)
   - Difícil (7 objetos)
   - Expert (8 objetos)

4. **Jogo** → Fase principal com objetos gerados dinamicamente
   - Objetos baseados no JSON
   - Sistema de conexões
   - Timer e pontuação
   - Tela de vitória

## 📄 Sistema de Objetos (objects.json)

Cada objeto tem a seguinte estrutura:

```json
{
  "name": "Nome do Objeto",
  "id": "id-unico",
  "file": "nome-do-componente",
  "in": ["ids-dos-objetos-aceitos-na-entrada"],
  "out": ["ids-dos-objetos-aceitos-na-saida"],
  "anim": "nome-da-animacao",
  "start": true/false,
  "end": true/false,
  "properties": {
    "color": "#cor",
    "position": { "x": 0, "y": 0, "z": 0 },
    "scale": { "x": 1, "y": 1, "z": 1 }
  }
}
```

### Propriedades:
- **name**: Nome exibido do objeto
- **id**: Identificador único
- **file**: Nome do componente A-Frame (sem extensão)
- **in**: Lista de IDs de objetos que podem conectar A este objeto
- **out**: Lista de IDs de objetos que este objeto pode conectar
- **anim**: Nome da animação (definida no JSON)
- **start**: Se pode ser objeto inicial
- **end**: Se pode ser objeto final
- **properties**: Propriedades visuais e de posicionamento

## 🔧 Componentes A-Frame

### Base Component (`base-component.js`)
- **game-object**: Componente base para todos os objetos
  - Gerencia propriedades básicas
  - Sistema de grab/release
  - Detecção de colisões
  - Criação de conexões
  - Highlighting visual

- **connection-line**: Componente para linhas de conexão
  - Cria cilindros conectando objetos
  - Atualiza posição em tempo real
  - Efeitos visuais (pulse, glow)

### Componentes Específicos
Cada tipo de objeto tem seu próprio componente com detalhes visuais únicos:
- **cube-component**: Bordas destacadas
- **sphere-component**: Campo de energia rotativo
- **cylinder-component**: Anéis superiores e inferiores
- **cone-component**: Espiral de partículas
- **torus-component**: Anéis orbitais

## 🎯 Sistema de Níveis

### Level Generator (`level-generator.js`)
- Seleciona objetos aleatórios baseado na dificuldade
- Garante que há pelo menos um start e um end
- Gera posições sem sobreposição
- Calcula conexões válidas
- Verifica se existe solução válida

### Dificuldades:
- **Fácil**: 3 objetos, conexões simples
- **Médio**: 5 objetos, mais complexidade
- **Difícil**: 7 objetos, múltiplos caminhos
- **Expert**: 8 objetos, máxima complexidade

## 🎨 Animações

Animações definidas no JSON e aplicadas automaticamente:
- **pulse**: Escala pulsante
- **rotate**: Rotação contínua
- **bounce**: Movimento vertical
- **float**: Flutuação suave
- **spin**: Rotação em Z
- **glow**: Emissão de luz pulsante
- **wobble**: Balanço suave
- **rotate-around**: Rotação complexa

## 🕹️ Controles

### Desktop/Mouse:
- **WASD**: Movimento
- **Mouse**: Olhar ao redor
- **Click**: Interação básica

### VR:
- **Joystick**: Movimento e rotação
- **Gatilho**: Pegar/soltar objetos
- **Grip**: Teletransporte (onde aplicável)
- **Thumbstick**: Ajustar distância do objeto pego

## 🚀 Como Executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Acessar:**
   - Local: https://localhost:3000/
   - Network: https://[seu-ip]:3000/

## 🎪 Atalhos de Desenvolvimento

- **Ctrl + 1**: Ir para Tutorial
- **Ctrl + 2**: Ir para Seleção de Fase  
- **Ctrl + 3**: Ir direto para o Jogo
- **Ctrl + 0**: Reiniciar jogo completo

## 🔍 Debug

Objetos globais disponíveis no console:
- `SceneManager`: Gerenciador de cenas
- `LevelGenerator`: Gerador de níveis
- `gameState`: Estado atual do jogo
- `tutorialState`: Estado do tutorial
- `levelSelectState`: Estado da seleção de fase

## 📱 Compatibilidade

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ VR Headsets (Meta Quest, HTC Vive, etc.)
- ✅ Mobile (modo 360°)
- ✅ AR (experimental)

## 🛠️ Expansões Futuras

- [ ] Sistema de pontuação
- [ ] Leaderboards
- [ ] Mais tipos de objetos
- [ ] Efeitos sonoros
- [ ] Multiplayer
- [ ] Editor de níveis
- [ ] Achievements