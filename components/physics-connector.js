// Physics Connector Component - RGVR
// Gerencia conexões físicas entre objetos em uma máquina de Rube Goldberg

AFRAME.registerComponent('physics-connector', {
    schema: {
        objectId: { type: 'string', default: '' },
        connectedObjects: { type: 'array', default: [] }, // IDs dos objetos conectados
        connectionType: { type: 'string', default: 'trigger' }, // trigger, chain, spring
        triggerRadius: { type: 'number', default: 2 },
        debug: { type: 'boolean', default: false }
    },

    init: function () {
        this.connections = [];
        this.triggered = false;
        this.onCollide = this.onCollide.bind(this);

        // Aguarda o corpo físico carregar
        if (this.el.body) {
            this.setupConnections();
        } else {
            this.el.addEventListener('body-loaded', () => {
                this.setupConnections();
            });
        }

        // Listen for collisions
        this.el.addEventListener('collide', this.onCollide);
        this.el.addEventListener('object-collision', this.onObjectCollision.bind(this));

        console.log('Physics connector initialized:', this.data.objectId);
    },

    setupConnections: function () {
        // Configura visualização de debug se necessário
        if (this.data.debug) {
            this.addDebugVisualization();
        }

        console.log('Connections ready for:', this.data.objectId);
    },

    addDebugVisualization: function () {
        // Esfera de raio de trigger
        const triggerSphere = document.createElement('a-entity');
        triggerSphere.setAttribute('geometry', {
            primitive: 'sphere',
            radius: this.data.triggerRadius
        });
        triggerSphere.setAttribute('material', {
            color: '#ffff00',
            opacity: 0.2,
            transparent: true,
            wireframe: true
        });
        triggerSphere.setAttribute('position', '0 0 0');

        this.el.appendChild(triggerSphere);
        this.debugSphere = triggerSphere;
    },

    onCollide: function (evt) {
        const otherEl = evt.detail.body?.el;
        if (!otherEl) return;

        const otherId = otherEl.getAttribute('game-object')?.objectId || otherEl.id;

        console.log('Collision detected:', {
            this: this.data.objectId,
            other: otherId
        });

        // Verifica se o objeto que colidiu está na lista de conexões esperadas
        if (this.data.connectedObjects.includes(otherId)) {
            this.triggerConnection(otherEl);
        }
    },

    onObjectCollision: function (evt) {
        const detail = evt.detail;
        console.log('Object collision event:', {
            from: this.data.objectId,
            impulse: detail.impulse
        });

        // Propaga efeito em cadeia se impulso for forte o suficiente
        if (!this.triggered && Math.abs(detail.impulse) > 2) {
            this.activateChainReaction();
        }
    },

    triggerConnection: function (otherObject) {
        if (this.triggered) return;

        this.triggered = true;
        console.log('Connection triggered!', {
            from: this.data.objectId,
            to: otherObject.id
        });

        // Emite evento de conexão bem sucedida
        this.el.sceneEl.emit('connection-made', {
            from: this.el,
            to: otherObject,
            connectionType: this.data.connectionType
        });

        // Efeito visual de conexão
        this.showConnectionEffect(otherObject);

        // Ativa o próximo objeto na cadeia
        setTimeout(() => {
            this.activateNextObject(otherObject);
        }, 500);
    },

    activateChainReaction: function () {
        if (this.triggered) return;

        this.triggered = true;
        console.log('Chain reaction activated:', this.data.objectId);

        // Emite partículas ou efeitos visuais
        this.el.emit('chain-activated', { objectId: this.data.objectId });

        // Efeito visual
        const pos = this.el.getAttribute('position');
        this.createParticleEffect(pos);
    },

    showConnectionEffect: function (otherObject) {
        // Cria uma linha visual entre os objetos
        const line = document.createElement('a-entity');
        const start = this.el.object3D.getWorldPosition(new THREE.Vector3());
        const end = otherObject.object3D.getWorldPosition(new THREE.Vector3());

        const distance = start.distanceTo(end);
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

        line.setAttribute('position', midpoint);
        line.setAttribute('geometry', {
            primitive: 'cylinder',
            radius: 0.05,
            height: distance
        });
        line.setAttribute('material', {
            color: '#00ff00',
            emissive: '#00ff00',
            emissiveIntensity: 1,
            opacity: 0.8,
            transparent: true
        });

        // Rotaciona para apontar do objeto A para B
        line.object3D.lookAt(end);
        line.object3D.rotateX(Math.PI / 2);

        // Animação de fade out
        line.setAttribute('animation', {
            property: 'material.opacity',
            from: 0.8,
            to: 0,
            dur: 1000,
            easing: 'easeInQuad'
        });

        this.el.sceneEl.appendChild(line);

        // Remove após animação
        setTimeout(() => {
            if (line.parentNode) {
                line.parentNode.removeChild(line);
            }
        }, 1000);
    },

    createParticleEffect: function (position) {
        // Cria um burst de partículas
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('a-entity');

            const angle = (Math.PI * 2 * i) / 10;
            const speed = 2;
            const targetX = position.x + Math.cos(angle) * speed;
            const targetY = position.y + 1;
            const targetZ = position.z + Math.sin(angle) * speed;

            particle.setAttribute('geometry', {
                primitive: 'sphere',
                radius: 0.1
            });
            particle.setAttribute('material', {
                color: '#ffff00',
                emissive: '#ffff00',
                emissiveIntensity: 1
            });
            particle.setAttribute('position', position);
            particle.setAttribute('animation', {
                property: 'position',
                to: `${targetX} ${targetY} ${targetZ}`,
                dur: 1000,
                easing: 'easeOutQuad'
            });
            particle.setAttribute('animation__fade', {
                property: 'material.opacity',
                from: 1,
                to: 0,
                dur: 1000,
                easing: 'easeInQuad'
            });

            this.el.sceneEl.appendChild(particle);

            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    },

    activateNextObject: function (nextObject) {
        // Se o próximo objeto for uma alavanca, ativa ela
        if (nextObject.components.lever) {
            nextObject.components.lever.turnOn();
        }

        // Se for um objeto físico, aplica força
        if (nextObject.body) {
            const direction = new THREE.Vector3(0, 0, -1);
            const force = direction.multiplyScalar(5);
            nextObject.body.applyImpulse(
                new CANNON.Vec3(force.x, force.y, force.z),
                new CANNON.Vec3(0, 0, 0)
            );
        }

        console.log('Activated next object:', nextObject.id);
    },

    // Método para adicionar conexão dinamicamente
    addConnection: function (objectId) {
        if (!this.data.connectedObjects.includes(objectId)) {
            this.data.connectedObjects.push(objectId);
            console.log('Connection added:', objectId);
        }
    },

    // Método para remover conexão
    removeConnection: function (objectId) {
        const index = this.data.connectedObjects.indexOf(objectId);
        if (index > -1) {
            this.data.connectedObjects.splice(index, 1);
            console.log('Connection removed:', objectId);
        }
    },

    // Reset do estado
    reset: function () {
        this.triggered = false;
        console.log('Connector reset:', this.data.objectId);
    },

    remove: function () {
        this.el.removeEventListener('collide', this.onCollide);
        this.el.removeEventListener('object-collision', this.onObjectCollision);

        if (this.debugSphere && this.debugSphere.parentNode) {
            this.debugSphere.parentNode.removeChild(this.debugSphere);
        }
    }
});

console.log('Physics connector component loaded');
