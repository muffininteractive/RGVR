# 💻 Exemplos de Código - Física Cannon.js

## 📚 Biblioteca de Snippets Prontos para Uso

---

## 1. 🎾 Criar Objetos com Física

### Esfera Básica

```javascript
const sphere = document.createElement('a-entity');
sphere.setAttribute('geometry', {
  primitive: 'sphere',
  radius: 0.5,
});
sphere.setAttribute('material', {
  color: '#ff0000',
  metalness: 0.3,
  roughness: 0.7,
});
sphere.setAttribute('dynamic-body', {
  mass: 1,
  linearDamping: 0.1,
  angularDamping: 0.1,
});
sphere.setAttribute('position', '0 3 -5');
sphere.setAttribute('shadow', 'cast: true');

// Aplica propriedades físicas
sphere.addEventListener('body-loaded', () => {
  sphere.body.material.restitution = 0.8; // Quica
  sphere.body.material.friction = 0.3;
});

scene.appendChild(sphere);
```

### Cubo Pesado

```javascript
const cube = document.createElement('a-entity');
cube.setAttribute('geometry', {
  primitive: 'box',
  width: 1,
  height: 1,
  depth: 1,
});
cube.setAttribute('material', {
  color: '#0000ff',
  metalness: 0.5,
  roughness: 0.5,
});
cube.setAttribute('dynamic-body', {
  mass: 5, // Mais pesado
  linearDamping: 0.05,
  angularDamping: 0.05,
});
cube.setAttribute('position', '0 2 -5');
cube.setAttribute('shadow', 'cast: true');

cube.addEventListener('body-loaded', () => {
  cube.body.material.restitution = 0.2; // Pouco quique
  cube.body.material.friction = 0.9; // Muita fricção
});

scene.appendChild(cube);
```

---

## 2. 🏗️ Estruturas Estáticas

### Chão Físico

```javascript
const ground = document.createElement('a-plane');
ground.setAttribute('position', '0 0 0');
ground.setAttribute('rotation', '-90 0 0');
ground.setAttribute('width', '50');
ground.setAttribute('height', '50');
ground.setAttribute('color', '#444444');
ground.setAttribute('static-body', '');
ground.setAttribute('shadow', 'receive: true');
ground.setAttribute('material', {
  roughness: 0.8,
  metalness: 0.2,
});

scene.appendChild(ground);
```

### Parede/Obstáculo

```javascript
const wall = document.createElement('a-box');
wall.setAttribute('position', '0 2 -10');
wall.setAttribute('width', '10');
wall.setAttribute('height', '4');
wall.setAttribute('depth', '0.5');
wall.setAttribute('color', '#666666');
wall.setAttribute('static-body', '');
wall.setAttribute('shadow', 'cast: true; receive: true');

scene.appendChild(wall);
```

### Rampa

```javascript
function createRamp(position, angle = 20, length = 5) {
  const ramp = document.createElement('a-box');
  ramp.setAttribute('position', position);
  ramp.setAttribute('rotation', `0 0 ${-angle}`);
  ramp.setAttribute('width', '2');
  ramp.setAttribute('height', '0.2');
  ramp.setAttribute('depth', length);
  ramp.setAttribute('color', '#555555');
  ramp.setAttribute('static-body', '');
  ramp.setAttribute('material', {
    metalness: 0.8,
    roughness: 0.2,
  });

  ramp.addEventListener('body-loaded', () => {
    ramp.body.material.friction = 0.1; // Lisa
    ramp.body.material.restitution = 0.1;
  });

  return ramp;
}

// Uso
const myRamp = createRamp('0 1 -5', 25, 4);
scene.appendChild(myRamp);
```

---

## 3. 🎲 Dominós

### Dominó Individual

```javascript
function createDomino(position, rotation = 0) {
  const domino = document.createElement('a-box');
  domino.setAttribute('position', position);
  domino.setAttribute('rotation', `0 ${rotation} 0`);
  domino.setAttribute('width', '0.3');
  domino.setAttribute('height', '2');
  domino.setAttribute('depth', '1');
  domino.setAttribute('color', '#8B4513');
  domino.setAttribute('dynamic-body', {
    mass: 0.5,
    linearDamping: 0.3,
    angularDamping: 0.2,
  });
  domino.setAttribute('shadow', 'cast: true');
  domino.classList.add('domino');

  domino.addEventListener('body-loaded', () => {
    domino.body.material.friction = 0.9;
    domino.body.material.restitution = 0.1;
  });

  return domino;
}

// Uso
const domino1 = createDomino('0 1 -5');
scene.appendChild(domino1);
```

### Fileira de Dominós

```javascript
function createDominoLine(startPos, count, spacing = 1.2, direction = 'z') {
  const dominoes = [];

  for (let i = 0; i < count; i++) {
    let pos = { ...startPos };

    if (direction === 'z') {
      pos.z += i * spacing;
    } else if (direction === 'x') {
      pos.x += i * spacing;
    }

    const domino = createDomino(
      `${pos.x} ${pos.y} ${pos.z}`,
      direction === 'x' ? 90 : 0
    );

    scene.appendChild(domino);
    dominoes.push(domino);
  }

  console.log(`Criados ${count} dominós`);
  return dominoes;
}

// Uso
const dominoes = createDominoLine({ x: 0, y: 1, z: -5 }, 10, 1.2, 'z');
```

---

## 4. ⚙️ Alavanca com Física

### Alavanca Completa

```html
<!-- No HTML -->
<a-entity
  id="lever1"
  lever="
        objectId: lever1;
        usePhysics: true;
        onAngle: -45;
        offAngle: 45;
        leverMass: 1;
        friction: 0.5;
        damping: 0.8;
        forceMultiplier: 2;
        debug: false;
    "
  position="0 0 -5"
>
</a-entity>
```

### Controlar Alavanca via JavaScript

```javascript
const lever = document.querySelector('#lever1');

// Ligar
lever.components.lever.turnOn();

// Desligar
lever.components.lever.turnOff();

// Alternar
lever.components.lever.toggle();

// Verificar estado
const isOn = lever.components.lever.getState();
console.log('Alavanca está:', isOn ? 'LIGADA' : 'DESLIGADA');

// Callbacks personalizados
lever.components.lever.onActivate(() => {
  console.log('Alavanca ATIVADA!');
  // Código customizado aqui
});

lever.components.lever.onDeactivate(() => {
  console.log('Alavanca DESATIVADA!');
  // Código customizado aqui
});

// Listen para eventos
lever.addEventListener('lever-changed', evt => {
  console.log('Estado mudou:', evt.detail);
});
```

---

## 5. 🔗 Conexões e Reações em Cadeia

### Objeto com Connector

```javascript
const sphere = document.createElement('a-entity');
sphere.setAttribute('id', 'ball1');
sphere.setAttribute('geometry', {
  primitive: 'sphere',
  radius: 0.5,
});
sphere.setAttribute('material', { color: '#ff0000' });
sphere.setAttribute('dynamic-body', { mass: 2 });
sphere.setAttribute('physics-connector', {
  objectId: 'ball1',
  connectedObjects: ['lever1', 'domino1'], // IDs conectados
  connectionType: 'trigger',
  triggerRadius: 2,
  debug: true, // Mostra esfera de debug
});
sphere.setAttribute('position', '0 3 -5');

scene.appendChild(sphere);
```

### Detectar Conexão Bem-Sucedida

```javascript
scene.addEventListener('connection-made', evt => {
  console.log('🎉 Conexão feita!', {
    from: evt.detail.from.id,
    to: evt.detail.to.id,
    type: evt.detail.connectionType,
  });

  // Adiciona pontos, toca som, etc.
});
```

### Chain Reaction Manual

```javascript
const obj1 = document.querySelector('#obj1');
const obj2 = document.querySelector('#obj2');

// Quando obj1 colide, ativa obj2
obj1.addEventListener('collide', evt => {
  const impulse = evt.detail.contact.getImpactVelocityAlongNormal();

  if (Math.abs(impulse) > 2) {
    // Aplica força em obj2
    const force = new CANNON.Vec3(0, 0, -10);
    obj2.body.applyImpulse(force, new CANNON.Vec3(0, 0, 0));

    console.log('⚡ Reação em cadeia ativada!');
  }
});
```

---

## 6. 💥 Efeitos Visuais

### Partículas em Colisão

```javascript
function createParticleBurst(position, color = '#ffff00', count = 10) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('a-sphere');
    particle.setAttribute('radius', '0.1');
    particle.setAttribute('color', color);
    particle.setAttribute('material', {
      emissive: color,
      emissiveIntensity: 1,
    });
    particle.setAttribute('position', position);

    // Direção aleatória
    const angle = (Math.PI * 2 * i) / count;
    const speed = 2;
    const targetX = position.x + Math.cos(angle) * speed;
    const targetY = position.y + 1 + Math.random();
    const targetZ = position.z + Math.sin(angle) * speed;

    particle.setAttribute('animation', {
      property: 'position',
      to: `${targetX} ${targetY} ${targetZ}`,
      dur: 1000,
      easing: 'easeOutQuad',
    });

    particle.setAttribute('animation__fade', {
      property: 'components.material.material.opacity',
      from: 1,
      to: 0,
      dur: 1000,
    });

    scene.appendChild(particle);

    setTimeout(() => particle.remove(), 1000);
  }
}

// Uso em colisão
sphere.addEventListener('collide', evt => {
  const pos = sphere.getAttribute('position');
  createParticleBurst(`${pos.x} ${pos.y} ${pos.z}`, '#ff0000');
});
```

### Linha de Conexão Visual

```javascript
function drawConnectionLine(objA, objB, color = '#00ff00') {
  const posA = objA.object3D.getWorldPosition(new THREE.Vector3());
  const posB = objB.object3D.getWorldPosition(new THREE.Vector3());

  const distance = posA.distanceTo(posB);
  const midpoint = new THREE.Vector3()
    .addVectors(posA, posB)
    .multiplyScalar(0.5);

  const line = document.createElement('a-cylinder');
  line.setAttribute('position', midpoint);
  line.setAttribute('radius', '0.05');
  line.setAttribute('height', distance);
  line.setAttribute('color', color);
  line.setAttribute('material', {
    emissive: color,
    emissiveIntensity: 1,
    opacity: 0.8,
    transparent: true,
  });

  // Rotaciona para apontar de A para B
  line.object3D.lookAt(posB);
  line.object3D.rotateX(Math.PI / 2);

  // Fade out
  line.setAttribute('animation', {
    property: 'components.material.material.opacity',
    from: 0.8,
    to: 0,
    dur: 1000,
    easing: 'easeInQuad',
  });

  scene.appendChild(line);
  setTimeout(() => line.remove(), 1000);
}

// Uso
scene.addEventListener('connection-made', evt => {
  drawConnectionLine(evt.detail.from, evt.detail.to);
});
```

---

## 7. 🎮 Interações Avançadas

### Pegar e Soltar com Física

```javascript
AFRAME.registerComponent('physics-grabbable', {
  init: function () {
    this.grabbed = false;
    this.originalMass = 0;

    this.el.addEventListener('gripdown', () => {
      if (this.el.body) {
        this.originalMass = this.el.body.mass;
        this.el.body.mass = 0; // Kinematic enquanto segura
        this.el.body.type = CANNON.Body.KINEMATIC;
        this.grabbed = true;
        console.log('🤏 Objeto agarrado');
      }
    });

    this.el.addEventListener('gripup', () => {
      if (this.el.body && this.grabbed) {
        this.el.body.mass = this.originalMass;
        this.el.body.type = CANNON.Body.DYNAMIC;
        this.grabbed = false;
        console.log('✋ Objeto solto');

        // Aplica velocidade do controller
        // (implementação completa requer rastreamento de velocidade)
      }
    });
  },
});
```

### Aplicar Força ao Clicar

```javascript
const sphere = document.querySelector('#mySphere');

sphere.addEventListener('click', () => {
  if (sphere.body) {
    // Força para cima
    const force = new CANNON.Vec3(0, 500, 0);
    sphere.body.applyImpulse(force, new CANNON.Vec3(0, 0, 0));

    console.log('🚀 Força aplicada!');
  }
});
```

### Telecinese (Mover Objeto com Mouse)

```javascript
AFRAME.registerComponent('telekinesis', {
  init: function () {
    this.targetPosition = null;

    this.el.addEventListener('mouseenter', () => {
      document.addEventListener('mousemove', this.onMouseMove.bind(this));
    });

    this.el.addEventListener('mouseleave', () => {
      document.removeEventListener('mousemove', this.onMouseMove);
    });
  },

  onMouseMove: function (evt) {
    // Calcula nova posição baseada no mouse
    // Aplica força suave em direção ao alvo
    if (this.el.body) {
      const currentPos = this.el.body.position;
      const force = new CANNON.Vec3(
        (this.targetPosition.x - currentPos.x) * 10,
        (this.targetPosition.y - currentPos.y) * 10,
        (this.targetPosition.z - currentPos.z) * 10
      );
      this.el.body.applyForce(force, currentPos);
    }
  },
});
```

---

## 8. 🛠️ Utilitários

### Reset de Todos os Objetos Físicos

```javascript
function resetPhysicsObjects() {
  const dynamicObjects = document.querySelectorAll('[dynamic-body]');

  dynamicObjects.forEach(obj => {
    if (obj.body) {
      // Reseta velocidade
      obj.body.velocity.set(0, 0, 0);
      obj.body.angularVelocity.set(0, 0, 0);

      // Reseta posição (se tiver data original)
      const originalPos = obj.getAttribute('data-original-position');
      if (originalPos) {
        obj.setAttribute('position', originalPos);
      }

      // Acorda objeto se estiver dormindo
      obj.body.wakeUp();
    }
  });

  console.log('🔄 Objetos físicos resetados');
}
```

### Pausar/Resumir Física

```javascript
function togglePhysics() {
  const scene = document.querySelector('a-scene');
  const physicsSystem = scene.systems.physics;

  if (physicsSystem.driver.world.time === 0) {
    // Resumir
    scene.setAttribute('physics', 'enabled', true);
    console.log('▶️ Física resumida');
  } else {
    // Pausar
    scene.setAttribute('physics', 'enabled', false);
    console.log('⏸️ Física pausada');
  }
}
```

### Contar Objetos por Tipo

```javascript
function getPhysicsStats() {
  const scene = document.querySelector('a-scene');
  const physicsSystem = scene.systems.physics;

  const stats = {
    staticBodies: document.querySelectorAll('[static-body]').length,
    dynamicBodies: document.querySelectorAll('[dynamic-body]').length,
    constraints: physicsSystem.driver.world.constraints.length,
    contacts: physicsSystem.driver.world.contacts.length,
  };

  console.table(stats);
  return stats;
}

// Chamar a cada 5 segundos
setInterval(getPhysicsStats, 5000);
```

---

## 9. 🎯 Receitas Completas

### Máquina de Rube Goldberg Simples

```javascript
// Bola inicial
const ball = document.createElement('a-sphere');
ball.setAttribute('position', '-5 3 -5');
ball.setAttribute('radius', '0.5');
ball.setAttribute('color', '#ff0000');
ball.setAttribute('dynamic-body', { mass: 2 });
scene.appendChild(ball);

// Rampa
const ramp = createRamp('-3 1 -5', 20, 4);
scene.appendChild(ramp);

// Fileira de dominós
const dominoes = createDominoLine({ x: 0, y: 1, z: -5 }, 8);

// Alavanca no final
const lever = document.createElement('a-entity');
lever.setAttribute('id', 'finalLever');
lever.setAttribute('lever', {
  objectId: 'finalLever',
  usePhysics: true,
});
lever.setAttribute('position', '5 0 -5');
scene.appendChild(lever);

console.log('🎪 Máquina de Rube Goldberg criada!');
```

---

## 📝 Notas Importantes

### Ordem de Inicialização

```javascript
// ✅ CORRETO - Aguarda body carregar
entity.addEventListener('body-loaded', () => {
  entity.body.material.friction = 0.5;
});

// ❌ ERRADO - Body pode não existir ainda
entity.body.material.friction = 0.5;
```

### Performance

```javascript
// ✅ BOM - Usa damping para parar objetos
dynamic-body="linearDamping: 0.1; angularDamping: 0.1"

// ❌ RUIM - Objetos continuam se movendo forever
dynamic-body="linearDamping: 0; angularDamping: 0"
```

---

**Use esses snippets como base para suas máquinas!** 🎪✨
