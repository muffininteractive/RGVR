// Sphere Component - RGVR

AFRAME.registerComponent('sphere-component', {
    dependencies: ['game-object'],

    schema: {
        // Propriedades físicas
        mass: { type: 'number', default: 1 },
        restitution: { type: 'number', default: 0.6 }, // Quique (0-1)
        friction: { type: 'number', default: 0.3 },
        linearDamping: { type: 'number', default: 0.1 },
        angularDamping: { type: 'number', default: 0.1 },
        usePhysics: { type: 'boolean', default: true }
    },

    init: function () {
        this.setupSphere();
    },

    setupSphere: function () {
        const objectData = JSON.parse(this.el.getAttribute('game-object').objectData);
        const radius = objectData.properties?.radius || 1;

        // Configura geometria da esfera
        this.el.setAttribute('geometry', {
            primitive: 'sphere',
            radius: radius
        });

        // Adiciona física se habilitado
        if (this.data.usePhysics) {
            this.el.setAttribute('dynamic-body', {
                mass: this.data.mass,
                shape: 'sphere',
                sphereRadius: radius,
                linearDamping: this.data.linearDamping,
                angularDamping: this.data.angularDamping
            });

            // Adiciona propriedades de material físico
            this.el.addEventListener('body-loaded', () => {
                const body = this.el.body;
                if (body) {
                    body.material.restitution = this.data.restitution;
                    body.material.friction = this.data.friction;
                    console.log(`Sphere physics configured:`, {
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

        // Adiciona detalhes visuais específicos da esfera
        this.addEnergyField();
    },

    onCollide: function (evt) {
        const otherEl = evt.detail.body.el;
        const impulse = evt.detail.contact.getImpactVelocityAlongNormal();

        console.log('Sphere collision:', {
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
        if (Math.abs(impulse) > 2) {
            this.showCollisionEffect();
        }
    },

    showCollisionEffect: function () {
        // Pulsa a cor em colisão
        const currentColor = this.el.getAttribute('material').color;
        this.el.setAttribute('animation__collision', {
            property: 'material.emissiveIntensity',
            from: 0,
            to: 0.5,
            dur: 200,
            dir: 'alternate',
            loop: 1,
            easing: 'easeInOutQuad'
        });
    },

    addEnergyField: function () {
        // Cria campo de energia ao redor da esfera
        const energyField = document.createElement('a-sphere');
        energyField.setAttribute('position', '0 0 0');
        energyField.setAttribute('scale', '1.1 1.1 1.1');
        energyField.setAttribute('material', {
            color: '#00ffff',
            opacity: 0.2,
            transparent: true,
            shader: 'flat'
        });
        energyField.setAttribute('animation', {
            property: 'rotation',
            to: '0 360 0',
            dur: 8000,
            loop: true
        });

        this.el.appendChild(energyField);
    }
});

console.log('Sphere component loaded');