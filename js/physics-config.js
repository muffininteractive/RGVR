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
            restitution: 1, // Menos quique
            friction: 1, // Mais fricção (estável)
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        },
        amortecido: {
            // Alto atrito, baixíssima restituição (quase sem quique)
            friction: 5,
            restitution: 0.1,
            linearDamping: 0.5,
            angularDamping: 0.5,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        },
        metal: {
            friction: 0.3,
            restitution: 0.3,
            contactEquationStiffness: 1e9,
            contactEquationRelaxation: 3,
            linearDamping: 0.01,
            angularDamping: 0.01,
        },
        wood: {
            friction: 0.1,
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
        },
        brick: {
            friction: 0.6,
            restitution: 0.4,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        },
        wax: {
            friction: 0.4,
            restitution: 0.2,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        }
    },

    // Configurações específicas por tipo de objeto
    objects: {
        sphere: {
            mass: 1,
            linearDamping: 0.05,
            angularDamping: 0.05,
            material: 'rubber'
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
            mass: 10,
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
        domino: {
            mass: 5, // Mais pesado
            linearDamping: 0.05,
            angularDamping: 0.05,
            material: 'wood' // Comportamento de madeira
        },
        ramp: {
            mass: 0, // Estático
            friction: 1,
            restitution: 1,
            material: 'wood'
        },
        platform: {
            mass: 0, // Estático
            restitution: 0.3, // Menos quique
            friction: 0.8, // Mais fricção (estável)
            linearDamping: 0.05,
            angularDamping: 0.05,
            material: 'amortecido'
        },
        model: {
            mass: 10,
            restitution: 0,
            friction: 1,
            linearDamping: 0.5,
            angularDamping: 0.5,
        },
        cannon: {
            mass: 10,
            restitution: 1,
            friction: 0.1,
            linearDamping: 0.05,
            angularDamping: 0.05,
            material: 'metal',
            customShape: "shape: box;halfExtents: 0.8 0.2 0.7;offset: -0.4 0.2 0;",
            customShape2: "shape: sphere;halfExtents: 0.7 0.3 0.5;offset: 0.1 0.9 0;radius:0.9;"
        },
        candle: {
            mass: 2, // Mais pesado
            restitution: 0.3, // Menos quique
            friction: 0.8, // Mais fricção (estável)
            linearDamping: 0.05,
            angularDamping: 0.05,
            material: 'wax',
            //customShape: "shape: cylinder;radiusTop: 0.19;radiusBottom: 0.19;height: 1.75;offset: 0 0.25 0;cylinderAxis:y"
        },
        wall: {
            mass: 0, // Estático
            friction: 1,
            restitution: 1,
            material: 'brick'
        },
        seesaw: {
            mass: 20,
            restitution: 0.3, // Menos quique
            friction: 0.8, // Mais fricção (estável)
            linearDamping: 0.05,
            angularDamping: 0.05,
            material: 'wood',
            customShape: "shape: box;halfExtents: 0.25 0.05 0.25;offset: 0 0 0;"
        },
        swing: {
            mass: 15,
            restitution: 0.2,
            friction: 0.7,
            linearDamping: 0.1,
            angularDamping: 0.1,
            material: 'wood',

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

    const CANNON = (typeof window !== 'undefined' && window.CANNON) ? window.CANNON : null;
    if (!CANNON) {
        // Fallback: muta material existente (menos ideal)
        body.material.friction = config.friction;
        body.material.restitution = config.restitution;
        body.material.contactEquationStiffness = config.contactEquationStiffness;
        body.material.contactEquationRelaxation = config.contactEquationRelaxation;
        console.log(`Material '${materialName}' aplicado (fallback sem criar novo material):`, config);
        return;
    }
    // Cria um material exclusivo por corpo para não propagar mudanças a outros objetos
    const newMat = new CANNON.Material(`mat_${materialName}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`);
    newMat.friction = config.friction;
    newMat.restitution = config.restitution;
    newMat.contactEquationStiffness = config.contactEquationStiffness;
    newMat.contactEquationRelaxation = config.contactEquationRelaxation;
    newMat.__isUnique = true;
    body.material = newMat;

    console.log(`Material '${materialName}' aplicado:`, config);
}


console.log('Physics config loaded');
