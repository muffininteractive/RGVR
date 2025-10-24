// river-raid-proc.js
// Gera fase procedural inspirada em River Raid para A-Frame VR

const RIVER_WIDTH = 8;
const RIVER_WIDTH_MIN = 6;
const RIVER_WIDTH_MAX = 30;
const RIVER_WIDTH_CHANGE_RATE = 0.18; // quanto pode variar por segmento
const RIVER_SEGMENT_LENGTH = 12;
const SEGMENTS_AHEAD = 46; // aumenta a distância de geração à frente
const SEGMENT_BUFFER = 24; // distância extra para remoção atrás da câmera
const BANK_WIDTH = 10;
const ISLAND_CHANCE = 0.25;
const ISLAND_MIN = 1.2;
const ISLAND_MAX = 2.5;
const CAMERA_Y = 2;
const CRUISE_SPEED = 0.18;
const MAX_SPEED = 0.35;
const MIN_SPEED = 0.08;

AFRAME.registerComponent('river-raid-proc', {
    schema: {},
    init() {
        this.segments = [];
        this.lastZ = 0;
        this.riverCenterX = 0;
        this.riverDir = 0;
        this.riverWidth = RIVER_WIDTH;
        this.targetRiverWidth = RIVER_WIDTH;
        this.riverWidthPhase = 0; // para controlar "ondas" de largura
        this.el.sceneEl.addEventListener('loaded', () => {
            this.cameraRig = document.querySelector('#cameraRig');
        });
        this.generateInitialSegments();
    },
    tick() {
        if (!this.cameraRig) this.cameraRig = document.querySelector('#cameraRig');
        if (!this.cameraRig) return;
        const camZ = this.cameraRig.object3D.position.z;
        // Remove todos os blocos atrás da câmera além do buffer
        while (this.segments.length && this.segments[0].z > camZ + SEGMENT_BUFFER * RIVER_SEGMENT_LENGTH) {
            this.removeSegment(this.segments.shift());
        }
        // Gera blocos à frente da câmera até o buffer
        while (this.lastZ > camZ - SEGMENTS_AHEAD * RIVER_SEGMENT_LENGTH) {
            this.addSegment();
        }
    },
    generateInitialSegments() {
        for (let i = 0; i < SEGMENTS_AHEAD; i++) this.addSegment();
    },
    addSegment() {
        // Variação gradual da largura do rio
        // Faseia a largura para criar "ondas" suaves
        if (this.riverWidthPhase <= 0) {
            // Inicia uma nova "onda" de largura
            this.targetRiverWidth = RIVER_WIDTH_MIN + Math.random() * (RIVER_WIDTH_MAX - RIVER_WIDTH_MIN);
            // Duração da onda: entre 8 e 20 segmentos
            this.riverWidthPhase = 5 + Math.floor(Math.random() * 16);
        }
        // Aproxima largura do alvo
        this.riverWidth += (this.targetRiverWidth - this.riverWidth) * RIVER_WIDTH_CHANGE_RATE;
        this.riverWidthPhase--;
        // Variação suave do centro do rio
        this.riverDir += (Math.random() - 0.5) * 2.4;
        this.riverDir = Math.max(-1.2, Math.min(1.2, this.riverDir));
        this.riverCenterX += this.riverDir;


        // Cubos altos nas laterais externas (paredes/canyon) colados à borda externa das margens principais ou extras
        /*
        if (this.riverWidth > 2 * RIVER_WIDTH_MIN) {
            // Quando há margens extras, alinhar blocos com as margens extras
            for (let side of [-1, 1]) {
                const wallHeight = 6 + Math.random() * 10;
                const wall = document.createElement('a-box');
                wall.setAttribute('width', 4);
                wall.setAttribute('height', wallHeight);
                wall.setAttribute('depth', RIVER_SEGMENT_LENGTH);
                wall.setAttribute('color', '#6b4f2c');
                const xVariation = (Math.random() - 0.5) * 1.2;
                // Mesma lógica da margem extra:
                const x = this.riverCenterX + side * (RIVER_WIDTH_MIN / 2 + (BANK_WIDTH - RIVER_WIDTH_MIN) / 4 + (this.riverWidth - RIVER_WIDTH_MIN) / 2) + xVariation;
                wall.setAttribute('position', `${x} ${wallHeight / 2} ${this.lastZ}`);
                this.el.sceneEl.appendChild(wall);
            }
        } else {
            // Caso normal, alinhar blocos com a borda externa da margem principal
            for (let side of [-1, 1]) {
                const wallHeight = 6 + Math.random() * 10;
                const wall = document.createElement('a-box');
                wall.setAttribute('width', 4);
                wall.setAttribute('height', wallHeight);
                wall.setAttribute('depth', RIVER_SEGMENT_LENGTH);
                wall.setAttribute('color', '#6b4f2c');
                const xVariation = (Math.random() - 0.5) * 1.2;
                const marginWidth = (BANK_WIDTH - this.riverWidth) / 2;
                const x = this.riverCenterX + side * (this.riverWidth / 2 + marginWidth) + xVariation;
                wall.setAttribute('position', `${x} ${wallHeight / 2} ${this.lastZ}`);
                this.el.sceneEl.appendChild(wall);
            }
        }
        */

        const block = document.createElement('a-entity');
        this.el.sceneEl.appendChild(block);
        // Rio
        const river = document.createElement('a-box');
        river.setAttribute('width', this.riverWidth);
        river.setAttribute('height', 0.1);
        river.setAttribute('depth', RIVER_SEGMENT_LENGTH);
        river.setAttribute('color', '#1e90ff');
        river.setAttribute('position', `${this.riverCenterX} 0 ${this.lastZ}`);
        river.setAttribute('material', 'opacity:0.92; transparent:true;');
        block.appendChild(river);

        for (let side of [-1, 1]) {
            const margin = document.createElement('a-box');
            margin.setAttribute('width', BANK_WIDTH / 2 + 1);
            margin.setAttribute('height', 0.5);
            margin.setAttribute('depth', RIVER_SEGMENT_LENGTH);
            margin.setAttribute('color', '#3a5f0b');
            const x = this.riverCenterX + side * (this.riverWidth / 2 + (BANK_WIDTH / 4));
            margin.setAttribute('position', `${x} 0.25 ${this.lastZ}`);
            block.appendChild(margin);

            const wallHeight = 6 + Math.random() * 10;
            const wall = document.createElement('a-box');
            wall.setAttribute('width', 6);
            wall.setAttribute('height', wallHeight);
            wall.setAttribute('depth', RIVER_SEGMENT_LENGTH);
            wall.setAttribute('color', '#6b4f2c');
            const xVariation = (Math.random() - 0.5) * 1.2;
            const xWall = this.riverCenterX + side * (this.riverWidth / 2 + (BANK_WIDTH / 2) + xVariation + 3);
            wall.setAttribute('position', `${xWall} ${wallHeight / 2} ${this.lastZ}`);
            block.appendChild(wall);
        }

        // Margens principais: se o rio for muito largo, margens principais ficam coladas ao canal central
        /*
        if (this.riverWidth > 2 * RIVER_WIDTH_MIN) {
            for (let side of [-1, 1]) {
                const margin = document.createElement('a-box');
                //margin.setAttribute('width', (BANK_WIDTH - this.riverWidth) / 2);
                margin.setAttribute('width', BANK_WIDTH);
                margin.setAttribute('height', 0.5);
                margin.setAttribute('depth', RIVER_SEGMENT_LENGTH);
                margin.setAttribute('color', '#3a5f0b');
                // Colada ao canal central
                const x = this.riverCenterX + side * (this.riverWidth / 2);
                margin.setAttribute('position', `${x} 0.25 ${this.lastZ}`);
                this.el.sceneEl.appendChild(margin);
            }
        } else {
            for (let side of [-1, 1]) {
                const margin = document.createElement('a-box');
                margin.setAttribute('width', (BANK_WIDTH - this.riverWidth) / 2);
                margin.setAttribute('height', 0.5);
                margin.setAttribute('depth', RIVER_SEGMENT_LENGTH);
                margin.setAttribute('color', '#3a5f0b');
                const x = this.riverCenterX + side * (this.riverWidth / 2 + (BANK_WIDTH - this.riverWidth) / 4);
                margin.setAttribute('position', `${x} 0.25 ${this.lastZ}`);
                this.el.sceneEl.appendChild(margin);
            }
        }
        // Se o rio ficou mais largo que o dobro do normal, adiciona "margens extras" para manter a distância
        /*
        if (this.riverWidth > 2 * RIVER_WIDTH_MIN) {
            for (let side of [-1, 1]) {
                const extra = document.createElement('a-box');
                extra.setAttribute('width', (BANK_WIDTH - RIVER_WIDTH_MIN) / 4);
                extra.setAttribute('height', 0.5);
                extra.setAttribute('depth', RIVER_SEGMENT_LENGTH);
                extra.setAttribute('color', '#3a5f0b');
                // Afastamento: metade da largura original + metade da diferença extra
                const dist = this.riverWidth / 2 + (BANK_WIDTH - this.riverWidth) / 4 + side * (this.riverWidth / 2 - RIVER_WIDTH_MIN / 2);
                // Posição: margem original + afastamento extra
                const x = this.riverCenterX + side * (RIVER_WIDTH_MIN / 2 + (BANK_WIDTH - RIVER_WIDTH_MIN) / 4 + (this.riverWidth - RIVER_WIDTH_MIN) / 2) + 11;
                extra.setAttribute('position', `${x} 0.25 ${this.lastZ}`);
                this.el.sceneEl.appendChild(extra);
            }
        }
        // Ilhas
        /*
        if (Math.random() < ISLAND_CHANCE) {
            const island = document.createElement('a-box');
            const iw = ISLAND_MIN + Math.random() * (ISLAND_MAX - ISLAND_MIN);
            const iz = this.lastZ + (Math.random() - 0.5) * (RIVER_SEGMENT_LENGTH * 0.5);
            island.setAttribute('width', iw);
            island.setAttribute('height', 0.13);
            island.setAttribute('depth', iw * (0.7 + Math.random() * 0.7));
            island.setAttribute('color', '#bfa76f');
            island.setAttribute('position', `${this.riverCenterX + (Math.random() - 0.5) * (this.riverWidth - iw)} 0 ${iz}`);
            this.el.sceneEl.appendChild(island);
        }
        */
        this.segments.push({ z: this.lastZ, block });
        this.lastZ -= RIVER_SEGMENT_LENGTH;
    },
    removeSegment(seg) {
        if (seg.block && seg.block.parentNode) seg.block.parentNode.removeChild(seg.block);
    }
});

// Sistema de projéteis com raycaster
class ProjectileSystem {
    constructor() {
        this.projectiles = [];
        this.projectileSpeed = 0.5;
        this.maxProjectiles = 100;
        this.scene = null;
        console.log('🚀 ProjectileSystem inicializado');
    }

    setScene(scene) {
        this.scene = scene;
        console.log('🌍 Scene definida para ProjectileSystem:', scene);
    }

    fire(position, direction, rigVelocity = new THREE.Vector3()) {
        console.log('💥 Fire chamado:', {
            projectilesAtuais: this.projectiles.length,
            maxProjectiles: this.maxProjectiles,
            scene: this.scene ? 'OK' : 'FALTANDO'
        });

        if (this.projectiles.length >= this.maxProjectiles) {
            console.warn('⚠️ Limite de projéteis atingido!');
            return;
        }

        // Cria container para o projétil + luz
        const projectileContainer = document.createElement('a-entity');
        projectileContainer.setAttribute('position', `${position.x} ${position.y} ${position.z}`);

        // Cria a esfera do projétil (aumentada de 0.1 para 0.3)
        const projectile = document.createElement('a-sphere');
        projectile.setAttribute('radius', '0.25');
        projectile.setAttribute('color', '#FFD700');
        projectile.setAttribute('material', 'emissive: #FFD700; emissiveIntensity: 1.0; metalness: 0.3; roughness: 0.1;');
        projectile.setAttribute('position', '0 0 0');
        projectile.setAttribute('scale', '1 1 1');

        projectileContainer.appendChild(projectile);

        // Adiciona uma luz para o projétil ser mais visível
        const light = document.createElement('a-light');
        light.setAttribute('type', 'point');
        light.setAttribute('intensity', '2');
        light.setAttribute('color', '#FFD700');
        light.setAttribute('distance', '10');
        light.setAttribute('decay', '2');
        projectileContainer.appendChild(light);

        if (this.scene) {
            this.scene.appendChild(projectileContainer);
            console.log('✅ Projétil criado e adicionado à cena em posição:', position);
        } else {
            console.error('❌ Scene não definida! Projétil não pode ser adicionado');
            return;
        }

        // Calcula a velocidade do projétil combinando direção + velocidade do rig
        const directionNorm = direction.normalize().clone();
        const projVelocity = directionNorm.multiplyScalar(this.projectileSpeed);
        projVelocity.add(rigVelocity);

        const proj = {
            el: projectileContainer,
            position: position.clone ? position.clone() : new THREE.Vector3(position.x, position.y, position.z),
            direction: directionNorm,
            velocity: projVelocity,
            lifetime: 200,
            age: 0
        };

        this.projectiles.push(proj);
        console.log(`✨ Projétil #${this.projectiles.length} criado. Velocidade:`, projVelocity);
        console.log('   Posição inicial:', position);
        console.log('   Raio: 0.25, Distância de luz: 10');
    }

    update() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.age++;

            // Remove projétil se expirou
            if (proj.age > proj.lifetime) {
                if (proj.el.parentNode) {
                    proj.el.parentNode.removeChild(proj.el);
                }
                console.log(`🗑️ Projétil #${i + 1} removido (expirou após ${proj.lifetime} frames)`);
                this.projectiles.splice(i, 1);
                continue;
            }

            // Atualiza posição do projétil
            proj.position.add(proj.velocity);
            proj.el.setAttribute('position', `${proj.position.x} ${proj.position.y} ${proj.position.z}`);

            // Log a cada 50 frames para não poluir console
            if (proj.age % 50 === 0) {
                console.log(`📍 Projétil #${i + 1} posição:`, proj.position, `idade: ${proj.age}/${proj.lifetime}`);
            }
        }
    }

    clear() {
        for (let proj of this.projectiles) {
            if (proj.el.parentNode) {
                proj.el.parentNode.removeChild(proj.el);
            }
        }
        this.projectiles = [];
    }
}

AFRAME.registerComponent('river-raid-controls', {
    schema: {},
    init() {
        console.log('🎮 river-raid-controls inicializando...');

        this.speed = CRUISE_SPEED;
        this.targetSpeed = CRUISE_SPEED;
        this.x = 0;
        this.targetX = 0;
        this.joystickX = 0;
        this.joystickY = 0;
        this.lasers = [];
        this.projectileSystem = new ProjectileSystem();
        this.controllerPos = new THREE.Vector3();
        this.controllerQuat = new THREE.Quaternion();
        this.rightController = null;
        this.leftController = null;
        this.raycastersReady = false;

        this.el.sceneEl.addEventListener('thumbstickmoved', this.onThumbstick.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        // Eventos do gatilho do controle VR
        // meta-touch-controls dispara 'triggerdown' no sceneEl
        this.el.sceneEl.addEventListener('triggerdown', this.onTriggerDown.bind(this));

        console.log('📡 Event listeners registrados:');
        console.log('  - triggerdown (meta-touch-controls)');

        // Aguarda a cena estar carregada
        this.el.sceneEl.addEventListener('loaded', () => {
            console.log('✅ Cena carregada, configurando controllers...');
            this.setupControllers();
            this.projectileSystem.setScene(this.el.sceneEl);
        });
        /*
                const loader = new AFRAME.THREE.GLTFLoader();
                loader.load('../assets/flying_carpet.glb', (gltf) => {
                    this.el.setObject3D('mesh', gltf.scene);
                });
        */
        /*
        const carpet = document.createElement('a-gltf-model');
        carpet.setAttribute('id', 'player-plane');
        carpet.setAttribute('animation-mixer')
        carpet.setAttribute('gltf-model', '../assets/flying_carpet.glb');
        carpet.setAttribute('scale', '0.5 0.5 0.5');
        carpet.setAttribute('rotation', '0 0 0');

        carpet.setAttribute('position', `0 0 0`);
        this.el.appendChild(carpet);
        */
        const carpetContainer = document.createElement('a-entity');
        carpetContainer.setAttribute('id', 'player-plane');
        carpetContainer.setAttribute('position', `0 0 0`);

        const carpet = document.createElement('a-plane');
        carpet.setAttribute('width', 1.5);
        carpet.setAttribute('height', 2.5);
        carpet.setAttribute('material', 'src: #carpeTex; transparent:true; opacity:1; side:double;alphaTest:0.5');
        carpet.setAttribute('position', `0 0 0`);
        carpet.setAttribute('rotation', '-90 0 0');
        carpetContainer.appendChild(carpet);

        this.el.appendChild(carpetContainer);

        this.planemodel = carpetContainer;
    },

    setupControllers() {
        console.log('🔍 Buscando controllers...');

        // Procura pelos controllers usando as classes CSS adicionadas
        this.rightController = document.querySelector('.right-control');
        this.leftController = document.querySelector('.left-control');

        this.raycastersReady = !!(this.rightController || this.leftController);
        console.log('🎮 Controllers encontrados:');
        console.log('  Right Controller:', this.rightController ? 'ENCONTRADO ✅' : 'NÃO ENCONTRADO ❌');
        console.log('  Left Controller:', this.leftController ? 'ENCONTRADO ✅' : 'NÃO ENCONTRADO ❌');
        console.log('  Raycasters prontos:', this.raycastersReady);
    },

    ensureControllersReady() {
        if (!this.rightController && !this.leftController) {
            console.log('⏳ Controllers ainda não prontos, tentando novamente...');
            this.setupControllers();
        }
        return this.rightController || this.leftController;
    },

    fireFromController(hand) {
        const controller = hand === 'right' ? this.rightController : this.leftController;
        console.log(`🔫 Tentando disparar de ${hand}:`, controller);

        if (!controller) {
            console.warn(`⚠️ Controller ${hand} não encontrado!`);
            return;
        }

        // Verifica se o objeto3D existe
        if (!controller.object3D) {
            console.warn(`⚠️ object3D não existe para controller ${hand}!`, controller);
            return;
        }

        // Pega a posição do controller
        const controllerPos = new THREE.Vector3();
        controller.object3D.getWorldPosition(controllerPos);

        // Pega o raycaster do controller (que aponta na direção correta do laser)
        let direction = new THREE.Vector3(0, 0, -1);

        // Tenta usar o raycaster do A-Frame se disponível
        const raycasterComp = controller.components.raycaster;
        if (raycasterComp && raycasterComp.raycaster) {
            direction.copy(raycasterComp.raycaster.ray.direction);
            console.log('  ✓ Usando direção do raycaster component');
        } else {
            // Fallback: usa a direção forward do objeto
            controller.object3D.getWorldDirection(direction);
            console.log('  ✓ Usando direção forward do objeto');
        }

        // Calcula a velocidade do rig (movimento para frente em Z negativo)
        const rigVelocity = new THREE.Vector3(0, 0, -this.speed);

        console.log(`✅ Disparo de ${hand}:`, {
            posição: `(${controllerPos.x.toFixed(2)}, ${controllerPos.y.toFixed(2)}, ${controllerPos.z.toFixed(2)})`,
            direção: `(${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}, ${direction.z.toFixed(2)})`,
            velocidadeRig: `(${rigVelocity.x.toFixed(2)}, ${rigVelocity.y.toFixed(2)}, ${rigVelocity.z.toFixed(2)})`,
            speedAtual: this.speed.toFixed(2)
        });

        // Dispara projétil com velocidade do rig
        this.projectileSystem.fire(controllerPos, direction, rigVelocity);
    },
    tick() {
        // Suaviza velocidade e posição
        this.speed += (this.targetSpeed - this.speed) * 0.08;
        this.x += (this.targetX - this.x) * 0.12;

        // Move rig para frente (Z negativo)
        const pos = this.el.object3D.position;
        pos.x = this.x;
        pos.z -= this.speed;
        pos.y = CAMERA_Y;

        // Atualiza sistema de projéteis
        this.projectileSystem.update();
    },
    onThumbstick(evt) {
        // x: lateral, y: frente/trás (aqui y controla velocidade)
        const { x, y } = evt.detail;
        this.joystickX = Math.abs(x) > 0.05 ? x : 0;
        this.joystickY = Math.abs(y) > 0.05 ? y : 0;
        this.targetX = this.x + this.joystickX * 0.45;
        this.targetSpeed = CRUISE_SPEED + this.joystickY * 0.13;
        this.targetSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, this.targetSpeed));


        if (this.planemodel) {
            // Inclina o avião no eixo Z conforme movimento lateral
            const maxTilt = 0.56;
            let tilt = this.joystickX * 3.5;
            tilt = Math.max(-maxTilt, Math.min(maxTilt, tilt));
            this.planemodel.object3D.rotation.set(0, 0, -tilt);
        }
    },
    onKeyDown(evt) {
        if (evt.key === 'a' || evt.key === 'ArrowLeft') { this.targetX = this.x - 0.5; }
        if (evt.key === 'd' || evt.key === 'ArrowRight') { this.targetX = this.x + 0.5; }
        if (evt.key === 'w' || evt.key === 'ArrowUp') this.targetSpeed = Math.min(MAX_SPEED, this.speed + 0.05);
        if (evt.key === 's' || evt.key === 'ArrowDown') this.targetSpeed = Math.max(MIN_SPEED, this.speed - 0.05);

        if (this.planemodel) {
            // Inclina o avião no eixo Z conforme a tecla pressionada
            const maxTilt = 0.56;
            let tilt = 0;
            if (evt.key === 'a' || evt.key === 'ArrowLeft') tilt = (this.targetX - this.x) * 3.5;
            if (evt.key === 'd' || evt.key === 'ArrowRight') tilt = (this.targetX - this.x) * 3.5;
            tilt = Math.max(-maxTilt, Math.min(maxTilt, tilt));
            this.planemodel.object3D.rotation.set(0, 0, -tilt);

        }
    },
    onKeyUp(evt) {
        if (["a", "d", "ArrowLeft", "ArrowRight"].includes(evt.key)) this.targetX = this.x;
        if (["w", "s", "ArrowUp", "ArrowDown"].includes(evt.key)) this.targetSpeed = CRUISE_SPEED;
        //Animação suave de retorno do avião à posição neutra
        if (this.planemodel) {
            this.planemodel.object3D.rotation.set(0, 0, 0);
        }
    },

    // Disparo ao pressionar gatilho
    onTriggerDown(evt) {
        console.log('🎯 Gatilho disparado');

        if (!this.ensureControllersReady()) {
            console.warn('⚠️ Controllers não disponíveis');
            return;
        }

        // Descobre qual controller disparou verificando o evento
        const target = evt.target;
        let hand = null;

        if (target.classList.contains('right-control')) {
            hand = 'right';
        } else if (target.classList.contains('left-control')) {
            hand = 'left';
        }

        if (hand) {
            console.log(`🔫 Disparando com ${hand}`);
            this.fireFromController(hand);
        } else {
            console.warn('⚠️ Não conseguiu identificar qual controller disparou');
        }
    }
});

