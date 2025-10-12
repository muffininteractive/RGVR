// Configuração global
const CONFIG = {
    DEBUG: true,
    INITIAL_POSITION: { x: 0, y: 1.6, z: 5 },
    COLORS: ['#4CC3D9', '#EF2D5E', '#FFC65D', '#7BC8A4', '#FF6B6B'],
    ANIMATION_DURATION: 1000
};

// Estado da aplicação
let appState = {
    isVRMode: false,
    isLoaded: false,
    camera: null,
    scene: null,
    objects: []
};

// Estado dos controles
let controllerState = {
    rightControllerPressed: false,
    preparingTeleport: false
};

// Utilitários
const Utils = {
    log: (message, type = 'info') => {
        if (CONFIG.DEBUG) {
            // Garantir que type é string
            const typeStr = typeof type === 'string' ? type : 'info';
            // Converter message para string se necessário
            const messageStr = typeof message === 'object' ? JSON.stringify(message) : String(message);
            console.log(`[A-Frame App] ${typeStr.toUpperCase()}: ${messageStr}`);
        }
    },

    randomColor: () => {
        return CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
    },

    randomPosition: (range = 10) => {
        const position = {
            x: (Math.random() - 0.5) * range,
            y: Math.random() * 3 + 1,
            z: (Math.random() - 0.5) * range - 5
        };
        return position;
    }
};

// Classe principal da aplicação
class AFrameApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.objects = [];
        this.init();
    }

    init() {
        Utils.log('Inicializando aplicação A-Frame...');

        document.addEventListener('DOMContentLoaded', () => {
            this.onDOMReady();
        });
    }

    onDOMReady() {
        this.scene = document.querySelector('a-scene');
        this.camera = document.querySelector('#cameraRig');

        if (this.scene) {
            this.scene.addEventListener('loaded', () => {
                this.onSceneLoaded();
            });
        }
    }

    onSceneLoaded() {
        Utils.log('Cena A-Frame carregada com sucesso!');
        appState.isLoaded = true;
        appState.scene = this.scene;
        appState.camera = this.camera;

    }

    handleKeyPress(event) {
        switch (event.key.toLowerCase()) {
            case ' ':
                event.preventDefault();
                this.addRandomObject();
                break;
            case 'r':
                this.resetCameraPosition();
                break;
            case 'd':
                this.toggleDebugMarkers();
                break;
            case 'h':
                this.toggleHandIndicators();
                break;
            case 'c':
                this.recenterVR();
                break;
            case 't':
                this.testTeleportation();
                break;
            case 'x':
                this.testControllerDebug();
                break;
        }
    }


    addRandomObject() {
        const types = ['a-box', 'a-sphere', 'a-cylinder'];
        const type = types[Math.floor(Math.random() * types.length)];
        const position = Utils.randomPosition();
        const color = Utils.randomColor();

        const obj = document.createElement(type);
        obj.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
        obj.setAttribute('color', color);
        obj.setAttribute('class', 'interactive');

        if (this.scene) {
            this.scene.appendChild(obj);
            this.objects.push(obj);

            setTimeout(() => {
                obj.addEventListener('click', () => this.onObjectClick(obj));
            }, 100);
        }

        Utils.log(`Objeto ${type} adicionado`);
    }

    resetCameraPosition() {
        const mainCamera = document.querySelector('#mainCamera');
        if (mainCamera) {
            mainCamera.setAttribute('position', `${CONFIG.INITIAL_POSITION.x} ${CONFIG.INITIAL_POSITION.y} ${CONFIG.INITIAL_POSITION.z}`);
            Utils.log('Posição da câmera resetada');
        }
    }
}


// Componente para pegar objetos com o controle VR
AFRAME.registerComponent('grab-handler', {
    init: function () {
        this.grabbedObject = null;
        this.grabDistance = 1.5; // Distância inicial do objeto ao controle
        this.initialGrabDistance = 1.5; // Guarda a distância inicial
        this.grabOffset = new THREE.Vector3(); // Offset do objeto em relação ao controle
        this.minDistance = 1;
        this.maxDistance = 10;
        this.distanceSpeed = 0.05;

        // Eventos de trigger (gatilho)
        this.el.addEventListener('triggerdown', this.onTriggerDown.bind(this));
        this.el.addEventListener('triggerup', this.onTriggerUp.bind(this));

        // Evento de thumbstick para controlar distância (no controle específico)
        /*
        this.el.addEventListener('thumbstickmoved', this.onThumbstickMoved.bind(this));
        */
    },

    onTriggerDown: function () {
        // Se já está segurando algo, não faz nada
        if (this.grabbedObject) return;

        // Obtém o raycaster do controle
        const raycasterComponent = this.el.components.raycaster;
        if (!raycasterComponent) return;

        const intersections = raycasterComponent.intersections;
        if (intersections && intersections.length > 0) {
            const intersection = intersections[0];
            const object = intersection.object.el;

            // Verifica se o objeto tem a classe "grab"
            if (object && object.classList.contains('grab')) {
                this.grabObject(object, intersection.point);
                console.log('Objeto capturado:', object);
            }
        }
    },

    onTriggerUp: function () {
        if (this.grabbedObject) {
            this.releaseObject();
            console.log('Objeto liberado');
        }
    },

    grabObject: function (object, hitPoint) {
        this.grabbedObject = object;

        // Obtém posições mundiais
        const controllerPos = new THREE.Vector3();
        const controllerDir = new THREE.Vector3();
        const objPos = new THREE.Vector3();

        this.el.object3D.getWorldPosition(controllerPos);
        this.el.object3D.getWorldDirection(controllerDir);
        object.object3D.getWorldPosition(objPos);

        // Inverte direção (para frente)
        controllerDir.negate();

        // Calcula a distância do controle até o objeto
        this.grabDistance = controllerPos.distanceTo(objPos);
        this.initialGrabDistance = this.grabDistance; // Salva distância inicial

        // Calcula o offset do objeto em relação à linha do raycaster
        // Isso mantém a posição relativa do objeto quando foi pego
        const rayPoint = controllerPos.clone().add(controllerDir.multiplyScalar(this.grabDistance));
        this.grabOffset.copy(objPos).sub(rayPoint);

        const feedback = this.el.sceneEl.querySelector('#teleport-feedback') || document.querySelector('#teleport-feedback');

        // Feedback visual
        if (feedback) {
            feedback.setAttribute('value', `Grabbed! Distance: ${this.grabDistance.toFixed(2)}m`);
            setTimeout(() => {
                feedback.setAttribute('value', '');
            }, 1500);
        }

        // Clamp da distância
        this.grabDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.grabDistance));

        // Para animações se houver
        object.removeAttribute('animation');
        object.removeAttribute('animation__position');
        object.removeAttribute('animation__rotation');

        // Feedback visual (opcional)
        const originalColor = object.getAttribute('color');
        this.originalColor = originalColor;
        object.setAttribute('color', '#FFFFFF');

        console.log('Objeto capturado. Posição:', objPos, 'Distância:', this.grabDistance, 'Offset:', this.grabOffset);
    },

    releaseObject: function () {
        if (this.grabbedObject) {
            // Restaura cor original
            if (this.originalColor) {
                this.grabbedObject.setAttribute('color', this.originalColor);
            }

            this.grabbedObject = null;
        }
    },

    onThumbstickMoved: function (evt) {
        // Se está segurando um objeto, usa o eixo Y do thumbstick para ajustar distância
        if (this.grabbedObject) {
            const { y } = evt.detail;

            if (Math.abs(y) > 0.1) {
                // Inverte: Y positivo = para trás (mais perto)
                // Y negativo = para frente (mais longe)
                this.grabDistance -= y * this.distanceSpeed;

                // Limita a distância
                this.grabDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.grabDistance));
            }

            // Para a propagação do evento para que o move-events não o processe
            evt.stopPropagation();
        }
    },

    tick: function () {
        // Se está segurando um objeto, atualiza sua posição
        if (this.grabbedObject) {
            // Obtém a posição e direção mundiais do controle
            const controllerPos = new THREE.Vector3();
            const controllerDir = new THREE.Vector3();

            this.el.object3D.getWorldPosition(controllerPos);
            this.el.object3D.getWorldDirection(controllerDir);

            // Inverte a direção para que o objeto fique na frente (não atrás)
            controllerDir.negate();

            // Calcula a posição alvo na direção do controle, à distância especificada
            const targetPos = controllerPos.clone().add(
                controllerDir.multiplyScalar(this.grabDistance)
            );

            // Escala o offset proporcionalmente à mudança de distância
            // Isso mantém o offset relativo constante quando você aproxima/afasta
            const distanceRatio = this.grabDistance / this.initialGrabDistance;
            const scaledOffset = this.grabOffset.clone().multiplyScalar(distanceRatio);

            // Adiciona o offset escalado para manter a posição relativa
            targetPos.add(scaledOffset);

            // Impede que o objeto fique abaixo do chão
            // Calcula a altura do objeto para posicioná-lo corretamente
            const geometry = this.grabbedObject.object3D.children[0]?.geometry;
            let objectHeight = 0;

            if (geometry) {
                geometry.computeBoundingBox();
                const bbox = geometry.boundingBox;
                if (bbox) {
                    objectHeight = (bbox.max.y - bbox.min.y) * this.grabbedObject.object3D.scale.y / 2;
                }
            }

            // Y mínimo = metade da altura do objeto (para ficar apoiado no chão)
            const minY = objectHeight;
            if (targetPos.y < minY) {
                targetPos.y = minY;
            }

            // Define a posição mundial do objeto diretamente
            this.grabbedObject.object3D.position.set(targetPos.x, targetPos.y, targetPos.z);
        }
    }
});

// Componente para teleporte e movimentação com joystick
AFRAME.registerComponent('move-events', {

    init: function () {
        this.cameraRig = document.querySelector('#cameraRig');
        this.raycaster = null; // Inicializa explicitamente
        this.teleportEnabled = true;
        this.joystickMoveSpeed = 0.1;
        this.turnSpeed = 2.5; // Velocidade de rotação

        // Registra eventos do raycaster
        this.el.addEventListener('raycaster-intersected', evt => {
            this.raycaster = evt.detail.el;
            console.log('Raycaster intersected:', this.raycaster);
        });
        this.el.addEventListener('raycaster-intersected-cleared', evt => {
            this.raycaster = null;
            console.log('Raycaster cleared');
        });

        // Movimentação pelo joystick (somente se NÃO estiver segurando objeto)
        this.el.sceneEl.addEventListener('thumbstickmoved', this.onJoystickMove.bind(this));
        this.el.sceneEl.addEventListener('gripdown', this.onTeleport.bind(this));
    },

    onTeleport: function (evt) {
        // Usa o raycaster do controle


        // Tenta obter o raycaster de diferentes formas
        let raycasterComponent = null;

        if (this.raycaster && this.raycaster.components.raycaster) {
            raycasterComponent = this.raycaster.components.raycaster;
        } else if (this.el.components.raycaster) {
            // Se não foi configurado via evento, tenta pegar diretamente do elemento
            raycasterComponent = this.el.components.raycaster;
        }



        // Pega as interseções do raycaster (ele já está configurado para .teleportable)
        const intersections = raycasterComponent.intersections;

        console.log('Intersections:', intersections);

        if (intersections && intersections.length > 0) {
            const intersection = intersections[0]; // Pega a primeira (mais próxima)
            const point = intersection.point;

            console.log('Teleport point:', point);

            // Posiciona o rig na altura correta (mantém altura do usuário)
            this.cameraRig.object3D.position.set(point.x, 0, point.z);


        } else {
            console.log('Nenhuma interseção encontrada');

        }
    },

    onJoystickMove: function (evt) {
        // y: frente/trás | x: gira lateralmente
        const { x, y } = evt.detail;
        const rig = this.cameraRig.object3D;

        // Movimentação para frente/trás
        if (Math.abs(y) > 0.1) {
            // Move na direção que o rig está olhando
            const dir = new THREE.Vector3();
            rig.getWorldDirection(dir);
            dir.y = 0; // Mantém no plano horizontal
            dir.normalize();
            rig.position.addScaledVector(dir, y * this.joystickMoveSpeed);
        }
        // Rotação lateral
        if (Math.abs(x) > 0.1) {
            rig.rotation.y -= x * this.turnSpeed * 0.01;
        }
    }
});

// Componente para fio flexível conectando dois cubos
AFRAME.registerComponent('flexible-wire', {
    schema: {
        target: { type: 'selector' },
        segments: { type: 'number', default: 20 },
        thickness: { type: 'number', default: 0.02 },
        color: { type: 'color', default: '#333333' },
        gravity: { type: 'number', default: 0.5 },
        stiffness: { type: 'number', default: 0.8 }
    },

    init: function () {
        this.wireSegments = [];
        this.createWire();
        this.time = 0;
    },

    createWire: function () {
        const data = this.data;

        // Remove segmentos anteriores se existirem
        this.wireSegments.forEach(seg => {
            if (seg && seg.parentNode) {
                seg.parentNode.removeChild(seg);
            }
        });
        this.wireSegments = [];

        // Cria os segmentos do fio
        for (let i = 0; i < data.segments; i++) {
            const segment = document.createElement('a-cylinder');
            segment.setAttribute('radius', data.thickness);
            segment.setAttribute('height', 0.1);
            segment.setAttribute('color', data.color);
            segment.setAttribute('metalness', 0.8);
            segment.setAttribute('roughness', 0.2);
            segment.classList.add('wire-segment');

            this.el.sceneEl.appendChild(segment);
            this.wireSegments.push(segment);
        }
    },

    tick: function (time, timeDelta) {
        if (!this.data.target) return;

        this.time += timeDelta * 0.001;

        const startPos = new THREE.Vector3();
        const endPos = new THREE.Vector3();

        // Pega as posições mundiais dos cubos
        this.el.object3D.getWorldPosition(startPos);
        this.data.target.object3D.getWorldPosition(endPos);

        const distance = startPos.distanceTo(endPos);
        const segments = this.data.segments;

        // Array para armazenar todos os pontos da curva
        const points = [];

        // Calcula todos os pontos da curva catenária primeiro
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;

            // Interpolação linear entre os pontos
            const pos = new THREE.Vector3().lerpVectors(startPos, endPos, t);

            // Adiciona curvatura (simulando gravidade)
            const sag = Math.sin(t * Math.PI) * this.data.gravity * (distance / 5);
            pos.y -= sag;

            // Garante que o ponto não fique abaixo do chão (y mínimo = 0.05)
            const groundLevel = 0.05; // Pequena margem acima do chão
            if (pos.y < groundLevel) {
                pos.y = groundLevel;
            }

            // Adiciona uma leve oscilação para simular flexibilidade
            const wave = Math.sin(this.time * 2 + t * 10) * 0.05 * (1 - this.data.stiffness);
            pos.x += wave * Math.cos(t * Math.PI);
            pos.z += wave * Math.sin(t * Math.PI);

            points.push(pos);
        }

        // Agora cria os cilindros conectando cada par de pontos consecutivos
        for (let i = 0; i < segments; i++) {
            const segment = this.wireSegments[i];
            if (segment) {
                const p1 = points[i];
                const p2 = points[i + 1];

                // Posiciona o cilindro no ponto médio entre p1 e p2
                const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
                segment.object3D.position.copy(midPoint);

                // Calcula o vetor direção e o comprimento
                const direction = new THREE.Vector3().subVectors(p2, p1);
                const length = direction.length();

                // Atualiza o comprimento do cilindro
                segment.setAttribute('height', length);

                // Alinha o cilindro com a direção (do p1 para p2)
                direction.normalize();
                const axis = new THREE.Vector3(0, 1, 0);
                const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
                segment.object3D.quaternion.copy(quaternion);
            }
        }
    },

    remove: function () {
        // Remove todos os segmentos quando o componente é removido
        this.wireSegments.forEach(seg => {
            if (seg && seg.parentNode) {
                seg.parentNode.removeChild(seg);
            }
        });
        this.wireSegments = [];
    }
});

// Inicialização
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new AFrameApp();
});

// Exportar para debug
window.AFrameApp = {
    app,
    Utils,
    CONFIG,
    appState
};