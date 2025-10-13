# Sistema de Física - RGVR

## 🎮 Implementação Cannon.js

Este documento descreve a implementação do sistema de física **Cannon.js** no projeto RGVR para criar máquinas de Rube Goldberg interativas em VR.

---

## 📦 Componentes Principais

### 1. **Physics System (Cannon.js)**

- **Biblioteca**: `aframe-physics-system v4.0.1`
- **Engine**: Cannon.js
- **Gravidade**: -9.8 m/s² (gravidade terrestre)
- **Configuração**: `scenes/game.html` → `<a-scene physics="driver: cannon; gravity: -9.8">`

### 2. **Componentes com Física**

#### **Lever Component** (`lever-component.js`)

Alavanca interativa com dobradiça física realista.

**Propriedades:**

```javascript
{
  usePhysics: true,        // Habilita física
  leverMass: 1,            // Massa da alavanca
  friction: 0.5,           // Fricção
  damping: 0.8,            // Amortecimento
  forceMultiplier: 2       // Multiplicador de força
}
```

**Funcionamento:**

- Base estática (`static-body`)
- Braço móvel com corpo dinâmico (`dynamic-body`)
- **Hinge Constraint** (dobradiça) conecta base e braço
- Motor ativa rotação suave entre estados ON/OFF
- Detecta colisões físicas para ativação automática

**Uso:**

```html
<a-entity
  lever="objectId: lever1; usePhysics: true; onAngle: -45; offAngle: 45"
  position="0 0 -5"
>
</a-entity>
```

---

#### **Sphere Component** (`sphere-component.js`)

Esfera com física realista para rolamento.

**Propriedades:**

```javascript
{
  mass: 1,                 // Massa
  restitution: 0.6,        // Quique (0-1)
  friction: 0.3,           // Fricção
  linearDamping: 0.1,      // Desaceleração linear
  angularDamping: 0.1,     // Desaceleração rotacional
  usePhysics: true
}
```

**Características:**

- Comportamento de borracha (quica bem)
- Rola suavemente
- Emite eventos de colisão
- Efeito visual em colisões fortes

---

#### **Cube Component** (`cube-component.js`)

Cubo/caixa mais pesado e estável.

**Propriedades:**

```javascript
{
  mass: 2,                 // Mais pesado que esfera
  restitution: 0.3,        // Menos quique
  friction: 0.8,           // Alta fricção (estável)
  linearDamping: 0.05,
  angularDamping: 0.05,
  usePhysics: true
}
```

**Características:**

- Comportamento de madeira
- Mais difícil de mover
- Ideal para obstáculos
- Efeito de shake em colisões fortes

---

#### **Physics Connector** (`physics-connector.js`)

Gerencia conexões e reações em cadeia entre objetos.

**Propriedades:**

```javascript
{
  objectId: 'obj1',
  connectedObjects: ['obj2', 'obj3'], // IDs conectados
  connectionType: 'trigger',           // trigger, chain, spring
  triggerRadius: 2,
  debug: false
}
```

**Funcionalidades:**

- Detecta colisões entre objetos específicos
- Ativa reações em cadeia
- Efeitos visuais de conexão (linhas, partículas)
- Propaga ativação para próximo objeto

**Uso:**

```html
<a-entity
  sphere-component
  physics-connector="objectId: ball1; connectedObjects: lever1, domino1"
  position="0 2 -5"
>
</a-entity>
```

---

## ⚙️ Configuração Física (`utils/physics-config.js`)

### Materiais Pré-Definidos

| Material    | Fricção | Restitução | Uso                       |
| ----------- | ------- | ---------- | ------------------------- |
| **rubber**  | 0.9     | 0.8        | Bolas, objetos que quicam |
| **metal**   | 0.3     | 0.3        | Alavancas, estruturas     |
| **wood**    | 0.6     | 0.4        | Cubos, plataformas        |
| **plastic** | 0.5     | 0.5        | Cilindros, cones          |
| **ice**     | 0.05    | 0.1        | Superfícies escorregadias |

### Helpers Disponíveis

#### **createDomino(scene, position, rotation)**

Cria um dominó físico individual.

```javascript
import { createDomino } from '../utils/physics-config.js';

const domino = createDomino(sceneEl, '0 1 -5', 0);
```

#### **createDominoChain(scene, startPos, count, direction, spacing)**

Cria uma fileira de dominós.

```javascript
import { createDominoChain } from '../utils/physics-config.js';

// Cria 10 dominós em linha reta (eixo Z)
const dominoes = createDominoChain(
  sceneEl,
  { x: 0, y: 1, z: -5 },
  10,
  'z',
  1.2
);
```

#### **createRamp(scene, position, length, angle)**

Cria uma rampa estática.

```javascript
import { createRamp } from '../utils/physics-config.js';

const ramp = createRamp(sceneEl, '2 0 -5', 5, 25);
```

---

## 🎪 Exemplos de Máquinas de Rube Goldberg

### Exemplo 1: Bola → Dominós → Alavanca

```html
<!-- Bola inicial -->
<a-entity
  id="ball1"
  sphere-component="mass: 1; restitution: 0.6"
  physics-connector="objectId: ball1; connectedObjects: domino1"
  position="0 3 -2"
  dynamic-body
>
</a-entity>

<!-- Fileira de dominós (criar via JS) -->
<script type="module">
  import { createDominoChain } from '../utils/physics-config.js';

  const scene = document.querySelector('a-scene');
  createDominoChain(scene, { x: 0, y: 1, z: -5 }, 8, 'z', 1.2);
</script>

<!-- Alavanca no final -->
<a-entity
  id="lever1"
  lever="objectId: lever1; usePhysics: true"
  position="0 0 -15"
>
</a-entity>
```

### Exemplo 2: Rampa → Cubo → Esfera em Cadeia

```javascript
import { createRamp, PhysicsConfig } from '../utils/physics-config.js';

const scene = document.querySelector('a-scene');

// Cria rampa
const ramp = createRamp(scene, '-3 0 -5', 4, 30);

// Cubo no topo da rampa
const cube = document.createElement('a-entity');
cube.setAttribute('cube-component', '');
cube.setAttribute('position', '-3 2 -3');
cube.setAttribute('dynamic-body', {
  mass: 2,
  friction: 0.8,
  restitution: 0.3,
});
scene.appendChild(cube);

// Esfera na base
const sphere = document.createElement('a-entity');
sphere.setAttribute('sphere-component', '');
sphere.setAttribute('position', '0 1 -7');
sphere.setAttribute('dynamic-body', {
  mass: 1,
  friction: 0.3,
  restitution: 0.6,
});
scene.appendChild(sphere);
```

---

## 🐛 Debug e Testes

### Ativar Debug Visual

```html
<!-- Ativa wireframes e visualização de física -->
<a-scene physics="driver: cannon; gravity: -9.8; debug: true"></a-scene>
```

### Ativar Debug de Componente

```html
<a-entity lever="debug: true" physics-connector="debug: true"> </a-entity>
```

### Console Logs

Todos os componentes logam eventos importantes:

- Colisões
- Ativações
- Conexões bem-sucedidas
- Erros de constraint

---

## 📊 Performance

### Otimizações

- **Amortecimento**: Objetos param naturalmente (economiza processamento)
- **Static Bodies**: Objetos fixos não simulados dinamicamente
- **Sleep Mode**: Objetos em repouso entram em "sleep" automaticamente
- **Collision Groups**: (futuro) Separar objetos em camadas de colisão

### Limites Recomendados (VR)

- **Objetos dinâmicos**: Máximo 50-100
- **Constraints**: Máximo 20-30
- **Dominós**: Até 20 por cadeia
- **FPS alvo**: 72 FPS (Quest 2), 90 FPS (desktop)

---

## 🚀 Próximos Passos

### Funcionalidades Futuras

- [ ] **Molas** (spring constraints)
- [ ] **Correntes** (chain constraints)
- [ ] **Engrenagens** (gear constraints)
- [ ] **Catapultas** (force impulse triggers)
- [ ] **Bola de Newton** (pendulum example)
- [ ] **Cascata d'água** (particle physics)
- [ ] **Ventilador** (wind zone)
- [ ] **Ímãs** (attraction forces)

### Melhorias

- [ ] Physics pooling (reutilização de objetos)
- [ ] Collision filtering por grupos
- [ ] Replay system (gravar e reproduzir)
- [ ] Editor visual de conexões
- [ ] Biblioteca de máquinas pré-montadas

---

## 📚 Recursos

- [A-Frame Physics System Docs](https://github.com/c-frame/aframe-physics-system)
- [Cannon.js Documentation](https://schteppe.github.io/cannon.js/)
- [Rube Goldberg Machines](https://en.wikipedia.org/wiki/Rube_Goldberg_machine)
- [Three.js + Cannon.js Examples](https://threejs.org/examples/?q=physics)

---

## 🎯 Resumo

✅ **Implementado:**

- Sistema de física Cannon.js integrado
- Componente lever com dobradiça física
- Sphere e Cube com propriedades físicas
- Sistema de conexões e reações em cadeia
- Helpers para dominós e rampas
- Configuração centralizada de física

🎮 **Pronto para:**

- Criar máquinas de Rube Goldberg complexas
- Interações físicas realistas em VR
- Efeitos visuais em colisões
- Progressão de níveis baseada em física

---

**Desenvolvido para RGVR - Máquinas de Rube Goldberg em VR** 🎪
