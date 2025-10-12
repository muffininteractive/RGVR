// Base Component - RGVR
// Componente base para todos os objetos do jogo

AFRAME.registerComponent('game-object', {
    schema: {
        objectId: { type: 'string', default: '' },
        objectData: { type: 'string', default: '{}' }, // JSON string
        isStart: { type: 'boolean', default: false },
        isEnd: { type: 'boolean', default: false },
        canGrab: { type: 'boolean', default: true }
    },

    init: function() {
        this.objectData = JSON.parse(this.data.objectData);
        this.isGrabbed = false;
        this.connections = [];
        this.originalPosition = null;
        
        // Configuração inicial
        this.setupObject();
        this.setupInteractions();
        this.setupAnimations();
        
        console.log(`Game object initialized: ${this.data.objectId}`, this.objectData);
    },

    setupObject: function() {
        // Configura propriedades básicas
        const props = this.objectData.properties;
        if (props) {
            // Posição
            if (props.position) {
                this.el.setAttribute('position', props.position);
                this.originalPosition = { ...props.position };
            }
            
            // Cor
            if (props.color) {
                this.el.setAttribute('color', props.color);
            }
            
            // Escala
            if (props.scale) {
                this.el.setAttribute('scale', props.scale);
            }
            
            // Propriedades do material
            if (props.metalness !== undefined || props.roughness !== undefined) {
                this.el.setAttribute('material', {
                    metalness: props.metalness || 0,
                    roughness: props.roughness || 1
                });
            }
        }
        
        // Classes CSS
        this.el.classList.add('game-object');
        if (this.data.canGrab) {
            this.el.classList.add('grab');
        }
        if (this.data.isStart) {
            this.el.classList.add('start-object');
        }
        if (this.data.isEnd) {
            this.el.classList.add('end-object');
        }
        
        // Shadow
        this.el.setAttribute('shadow', 'cast: true; receive: true');
    },

    setupInteractions: function() {
        if (!this.data.canGrab) return;
        
        // Event listeners para interações
        this.el.addEventListener('grab-start', this.onGrabStart.bind(this));
        this.el.addEventListener('grab-end', this.onGrabEnd.bind(this));
        this.el.addEventListener('collision-start', this.onCollisionStart.bind(this));
    },

    setupAnimations: function() {
        const animName = this.objectData.anim;
        if (!animName || !window.gameAnimations) return;
        
        const animConfig = window.gameAnimations[animName];
        if (animConfig) {
            this.el.setAttribute('animation', animConfig);
        }
    },

    onGrabStart: function(event) {
        this.isGrabbed = true;
        
        // Para animações quando pego
        this.el.removeAttribute('animation');
        
        // Efeito visual
        this.el.setAttribute('material.emissive', '#222222');
        this.el.setAttribute('material.emissiveIntensity', 0.3);
        
        // Emite evento para o game manager
        this.el.sceneEl.emit('object-grabbed', { 
            objectId: this.data.objectId, 
            element: this.el 
        });
        
        console.log(`Object grabbed: ${this.data.objectId}`);
    },

    onGrabEnd: function(event) {
        this.isGrabbed = false;
        
        // Restaura animações
        this.setupAnimations();
        
        // Remove efeito visual
        this.el.setAttribute('material.emissive', '#000000');
        this.el.setAttribute('material.emissiveIntensity', 0);
        
        // Emite evento para o game manager
        this.el.sceneEl.emit('object-released', { 
            objectId: this.data.objectId, 
            element: this.el 
        });
        
        console.log(`Object released: ${this.data.objectId}`);
    },

    onCollisionStart: function(event) {
        const otherEl = event.detail.target.el;
        const otherComponent = otherEl.components['game-object'];
        
        if (otherComponent) {
            this.checkConnection(otherComponent);
        }
    },

    checkConnection: function(otherComponent) {
        const myId = this.data.objectId;
        const otherId = otherComponent.data.objectId;
        
        // Verifica se pode conectar usando o LevelGenerator
        if (window.LevelGenerator && window.LevelGenerator.canConnect(myId, otherId)) {
            this.createConnection(otherComponent);
        }
    },

    createConnection: function(otherComponent) {
        const connectionId = `${this.data.objectId}-${otherComponent.data.objectId}`;
        
        // Verifica se já existe conexão
        if (this.connections.includes(connectionId)) return;
        
        this.connections.push(connectionId);
        otherComponent.connections.push(connectionId);
        
        // Cria linha visual de conexão
        this.createVisualConnection(otherComponent, connectionId);
        
        // Emite evento de conexão
        this.el.sceneEl.emit('objects-connected', {
            from: this.data.objectId,
            to: otherComponent.data.objectId,
            connectionId: connectionId
        });
        
        console.log(`Connection created: ${connectionId}`);
    },

    createVisualConnection: function(otherComponent, connectionId) {
        const scene = this.el.sceneEl;
        
        // Remove conexão anterior se existir
        const existingConnection = scene.querySelector(`#${connectionId}`);
        if (existingConnection) {
            existingConnection.parentNode.removeChild(existingConnection);
        }
        
        // Cria nova conexão
        const connection = document.createElement('a-entity');
        connection.id = connectionId;
        connection.setAttribute('connection-line', {
            from: `#${this.el.id}`,
            to: `#${otherComponent.el.id}`
        });
        
        scene.appendChild(connection);
    },

    highlight: function(type = 'default') {
        const colors = {
            'start': '#00ff00',
            'end': '#ff0000',
            'valid': '#ffff00',
            'invalid': '#ff0000',
            'default': '#ffffff'
        };
        
        this.el.setAttribute('animation__highlight', {
            property: 'material.emissive',
            to: colors[type],
            dur: 500,
            dir: 'alternate',
            loop: 3
        });
    },

    removeHighlight: function() {
        this.el.removeAttribute('animation__highlight');
        this.el.setAttribute('material.emissive', '#000000');
    },

    reset: function() {
        // Volta à posição original
        if (this.originalPosition) {
            this.el.setAttribute('position', this.originalPosition);
        }
        
        // Remove conexões
        this.connections.forEach(connectionId => {
            const connection = this.el.sceneEl.querySelector(`#${connectionId}`);
            if (connection) {
                connection.parentNode.removeChild(connection);
            }
        });
        this.connections = [];
        
        // Restaura estado inicial
        this.isGrabbed = false;
        this.removeHighlight();
        this.setupAnimations();
    }
});

// Componente para linhas de conexão
AFRAME.registerComponent('connection-line', {
    schema: {
        from: { type: 'selector' },
        to: { type: 'selector' },
        color: { type: 'color', default: '#00ffff' },
        thickness: { type: 'number', default: 0.05 }
    },

    init: function() {
        this.line = null;
        this.createLine();
    },

    createLine: function() {
        if (!this.data.from || !this.data.to) return;
        
        // Cria cilindro para a linha
        this.line = document.createElement('a-cylinder');
        this.line.setAttribute('radius', this.data.thickness);
        this.line.setAttribute('color', this.data.color);
        this.line.setAttribute('material', {
            metalness: 0.8,
            roughness: 0.2,
            emissive: this.data.color,
            emissiveIntensity: 0.3
        });
        
        // Adiciona animação de pulse
        this.line.setAttribute('animation__pulse', {
            property: 'material.emissiveIntensity',
            to: 0.8,
            dur: 1000,
            dir: 'alternate',
            loop: true
        });
        
        this.el.appendChild(this.line);
        this.updateLine();
    },

    updateLine: function() {
        if (!this.line || !this.data.from || !this.data.to) return;
        
        const pos1 = this.data.from.object3D.position;
        const pos2 = this.data.to.object3D.position;
        
        // Calcula posição e rotação
        const midPoint = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5);
        const direction = new THREE.Vector3().subVectors(pos2, pos1);
        const length = direction.length();
        
        // Atualiza linha
        this.line.setAttribute('height', length);
        this.line.object3D.position.copy(midPoint);
        
        // Alinha com direção
        const axis = new THREE.Vector3(0, 1, 0);
        direction.normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
        this.line.object3D.quaternion.copy(quaternion);
    },

    tick: function() {
        // Atualiza linha constantemente para seguir objetos em movimento
        this.updateLine();
    }
});

console.log('Base components loaded');