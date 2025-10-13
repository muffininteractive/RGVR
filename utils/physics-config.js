// Physics Configuration - RGVR
// Configurações centralizadas de física para objetos do jogo

export const PhysicsConfig = {
    // Configurações globais
    world: {
        gravity: -9.8,
        iterations: 10,
        broadphase: 'NaiveBroadphase',
        solver: 'GSSolver',
        solverIterations: 10
    },

    // Materiais físicos pré-definidos
    materials: {
        rubber: {
            friction: 0.9,
            restitution: 0.8,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        },
        metal: {
            friction: 0.3,
            restitution: 0.3,
            contactEquationStiffness: 1e9,
            contactEquationRelaxation: 3
        },
        wood: {
            friction: 0.6,
            restitution: 0.4,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        },
        plastic: {
            friction: 0.5,
            restitution: 0.5,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        },
        ice: {
            friction: 0.05,
            restitution: 0.1,
            contactEquationStiffness: 1e7,
            contactEquationRelaxation: 3
        }
    },

    // Configurações específicas por tipo de objeto
    objects: {
        sphere: {
            mass: 1,
            restitution: 0.6, // Quique médio
            friction: 0.3,
            linearDamping: 0.1,
            angularDamping: 0.1,
            material: 'rubber' // Bola quica bem
        },
        cube: {
            mass: 2, // Mais pesado
            restitution: 0.3, // Menos quique
            friction: 0.8, // Mais fricção (estável)
            linearDamping: 0.05,
            angularDamping: 0.05,
            material: 'wood' // Comportamento de madeira
        },
        cylinder: {
            mass: 1.5,
            restitution: 0.4,
            friction: 0.5,
            linearDamping: 0.1,
            angularDamping: 0.15, // Rola mas estabiliza
            material: 'plastic'
        },
        cone: {
            mass: 0.8, // Mais leve (pontiagudo)
            restitution: 0.5,
            friction: 0.4,
            linearDamping: 0.15,
            angularDamping: 0.2,
            material: 'plastic'
        },
        torus: {
            mass: 1.2,
            restitution: 0.5,
            friction: 0.4,
            linearDamping: 0.1,
            angularDamping: 0.1,
            material: 'rubber'
        },
        lever: {
            mass: 1,
            friction: 0.5,
            damping: 0.8, // Alto amortecimento (não oscila)
            forceMultiplier: 2,
            material: 'metal'
        }
    },

    // Configurações para dominós (efeito cascata)
    domino: {
        mass: 0.5, // Leve para cair fácil
        restitution: 0.1, // Não quica
        friction: 0.9, // Alta fricção (não desliza)
        linearDamping: 0.3,
        angularDamping: 0.2,
        height: 2,
        width: 0.3,
        depth: 1,
        spacing: 1.2 // Distância entre dominós
    },

    // Configurações para rampas
    ramp: {
        friction: 0.2, // Lisa (objetos deslizam)
        restitution: 0.1,
        angle: 25 // Graus de inclinação padrão
    },

    // Configurações para molas/springs
    spring: {
        stiffness: 100,
        damping: 1,
        restLength: 1,
        maxForce: 1000
    },

    // Configurações para constraints
    constraints: {
        hinge: {
            maxForce: 10,
            motorSpeed: 3,
            motorMaxForce: 50
        },
        pointToPoint: {
            maxForce: 100
        },
        distance: {
            maxForce: 50
        }
    },

    // Thresholds para detecção de eventos
    thresholds: {
        minCollisionImpulse: 2, // Impulso mínimo para efeito visual
        strongCollisionImpulse: 5, // Impulso para colisão "forte"
        dominoTriggerImpulse: 0.5, // Impulso para derrubar dominó
        leverActivationImpulse: 3 // Impulso para ativar alavanca
    },

    // Configurações para debugging
    debug: {
        showWireframes: false,
        showContactPoints: false,
        showVelocity: false,
        logCollisions: true
    }
};

// Helper para aplicar configuração de material
export function applyPhysicsMaterial(body, materialName) {
    const config = PhysicsConfig.materials[materialName];
    if (!config) {
        console.warn(`Material físico '${materialName}' não encontrado`);
        return;
    }

    body.material.friction = config.friction;
    body.material.restitution = config.restitution;
    body.material.contactEquationStiffness = config.contactEquationStiffness;
    body.material.contactEquationRelaxation = config.contactEquationRelaxation;

    console.log(`Material '${materialName}' aplicado:`, config);
}

// Helper para criar um dominó físico
export function createDomino(scene, position, rotation = 0) {
    const config = PhysicsConfig.domino;

    const domino = document.createElement('a-entity');
    domino.setAttribute('position', position);
    domino.setAttribute('rotation', `0 ${rotation} 0`);
    domino.setAttribute('geometry', {
        primitive: 'box',
        width: config.width,
        height: config.height,
        depth: config.depth
    });
    domino.setAttribute('material', {
        color: '#8B4513',
        metalness: 0.2,
        roughness: 0.8
    });
    domino.setAttribute('dynamic-body', {
        mass: config.mass,
        linearDamping: config.linearDamping,
        angularDamping: config.angularDamping
    });
    domino.setAttribute('shadow', 'cast: true; receive: true');
    domino.classList.add('domino');

    // Aplica material físico após body carregar
    domino.addEventListener('body-loaded', () => {
        if (domino.body) {
            domino.body.material.friction = config.friction;
            domino.body.material.restitution = config.restitution;
        }
    });

    scene.appendChild(domino);
    return domino;
}

// Helper para criar uma fileira de dominós
export function createDominoChain(scene, startPos, count, direction = 'z', spacing = null) {
    const config = PhysicsConfig.domino;
    const actualSpacing = spacing || config.spacing;
    const dominoes = [];

    for (let i = 0; i < count; i++) {
        let pos = { ...startPos };

        if (direction === 'z') {
            pos.z += i * actualSpacing;
        } else if (direction === 'x') {
            pos.x += i * actualSpacing;
        }

        const domino = createDomino(scene, `${pos.x} ${pos.y} ${pos.z}`, direction === 'x' ? 90 : 0);
        dominoes.push(domino);
    }

    console.log(`Criada cadeia de ${count} dominós em direção ${direction}`);
    return dominoes;
}

// Helper para criar rampa
export function createRamp(scene, position, length = 5, angle = null) {
    const config = PhysicsConfig.ramp;
    const actualAngle = angle || config.angle;

    const ramp = document.createElement('a-entity');
    ramp.setAttribute('position', position);
    ramp.setAttribute('rotation', `0 0 ${-actualAngle}`);
    ramp.setAttribute('geometry', {
        primitive: 'box',
        width: 2,
        height: 0.2,
        depth: length
    });
    ramp.setAttribute('material', {
        color: '#555555',
        metalness: 0.8,
        roughness: 0.2
    });
    ramp.setAttribute('static-body', '');
    ramp.setAttribute('shadow', 'receive: true');

    // Aplica material físico
    ramp.addEventListener('body-loaded', () => {
        if (ramp.body) {
            ramp.body.material.friction = config.friction;
            ramp.body.material.restitution = config.restitution;
        }
    });

    scene.appendChild(ramp);
    return ramp;
}

console.log('Physics config loaded');
