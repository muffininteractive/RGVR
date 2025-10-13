// Cube Component - RGVR

AFRAME.registerComponent('cube-component', {
    dependencies: ['game-object'],

    schema: {
        // Propriedades físicas
        mass: { type: 'number', default: 2 }, // Mais pesado que esfera
        restitution: { type: 'number', default: 0.3 }, // Menos quique
        friction: { type: 'number', default: 0.8 }, // Mais fricção
        linearDamping: { type: 'number', default: 0.05 },
        angularDamping: { type: 'number', default: 0.05 },
        usePhysics: { type: 'boolean', default: true }
    },

    init: function () {
        this.setupCube();
    },

    setupCube: function () {
        const objectData = JSON.parse(this.el.getAttribute('game-object').objectData);
        const size = objectData.properties?.size || { width: 1, height: 1, depth: 1 };

        // Configura geometria do cubo
        this.el.setAttribute('geometry', {
            primitive: 'box',
            width: size.width || 1,
            height: size.height || 1,
            depth: size.depth || 1
        });

        // Adiciona física se habilitado
        if (this.data.usePhysics) {
            this.el.setAttribute('dynamic-body', {
                mass: this.data.mass,
                shape: 'box',
                width: size.width || 1,
                height: size.height || 1,
                depth: size.depth || 1,
                linearDamping: this.data.linearDamping,
                angularDamping: this.data.angularDamping
            });

            // Adiciona propriedades de material físico
            this.el.addEventListener('body-loaded', () => {
                const body = this.el.body;
                if (body) {
                    body.material.restitution = this.data.restitution;
                    body.material.friction = this.data.friction;
                    console.log(`Cube physics configured:`, {
                        mass: this.data.mass,
                        restitution: this.data.restitution,
                        friction: this.data.friction
                    });
                }
            });

            // Listener para colisões
            this.el.addEventListener('collide', (evt) => {
                this.onCollide(evt);
            });
        }

        // Adiciona detalhes visuais específicos do cubo
        this.addEdgeHighlights();
    },

    onCollide: function (evt) {
        const otherEl = evt.detail.body.el;
        const impulse = evt.detail.contact.getImpactVelocityAlongNormal();

        console.log('Cube collision:', {
            with: otherEl?.id || 'unknown',
            impulse: impulse.toFixed(2)
        });

        // Emite evento customizado para game manager
        this.el.emit('object-collision', {
            thisObject: this.el,
            otherObject: otherEl,
            impulse: impulse
        });

        // Efeito visual em colisão forte
        if (Math.abs(impulse) > 3) {
            this.showCollisionEffect();
        }
    },

    showCollisionEffect: function () {
        // Shake effect em colisão forte
        const pos = this.el.getAttribute('position');
        this.el.setAttribute('animation__shake', {
            property: 'position',
            from: `${pos.x - 0.05} ${pos.y} ${pos.z}`,
            to: `${pos.x + 0.05} ${pos.y} ${pos.z}`,
            dur: 100,
            dir: 'alternate',
            loop: 2,
            easing: 'linear'
        });
    },

    addEdgeHighlights: function () {
        // Cria wireframe para destacar bordas
        const wireframe = document.createElement('a-box');
        wireframe.setAttribute('position', '0 0 0');
        wireframe.setAttribute('scale', '1.02 1.02 1.02');
        wireframe.setAttribute('material', {
            color: '#ffffff',
            wireframe: true,
            opacity: 0.3,
            transparent: true
        });

        this.el.appendChild(wireframe);
    }
});

console.log('Cube component loaded');