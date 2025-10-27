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

// Definição dos tipos de alvos
const TARGET_TYPES = {
    GOLD: { color: '#FFD700', points: 100, radius: 0.3, name: 'Gold', shape: 'cylinder' },
    SILVER: { color: '#C0C0C0', points: 50, radius: 0.25, name: 'Silver', shape: 'cylinder' },
    BRONZE: { color: '#CD7F32', points: 25, radius: 0.2, name: 'Bronze', shape: 'cylinder' },
    RUBY: { color: '#E0115F', points: 150, radius: 0.35, name: 'Ruby', shape: 'cylinder' },
    MISS: { color: '#1a1a1a', points: 0, radius: 0.8, name: 'Miss', shape: 'octahedron', damage: 1 }
};
const TARGET_SPAWN_CHANCE = 0.4; // Chance de spawnar um alvo por segmento
const MISS_SPAWN_CHANCE = 0.15; // Chance de spawnar um miss entre os alvos

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
        this.targets = []; // Array para rastrear alvos
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
        // Remove alvos atrás da câmera
        for (let i = this.targets.length - 1; i >= 0; i--) {
            if (this.targets[i].z > camZ + SEGMENT_BUFFER * RIVER_SEGMENT_LENGTH) {
                if (this.targets[i].el.parentNode) {
                    this.targets[i].el.parentNode.removeChild(this.targets[i].el);
                }
                this.targets.splice(i, 1);
            }
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
        block.setAttribute('position', `${this.riverCenterX} 0 ${this.lastZ}`);
        this.el.sceneEl.appendChild(block);
        // Rio
        const river = document.createElement('a-box');
        river.setAttribute('width', this.riverWidth);
        river.setAttribute('height', 0.1);
        river.setAttribute('depth', RIVER_SEGMENT_LENGTH);
        river.setAttribute('color', '#1e90ff');
        river.setAttribute('position', `0 0 0`);
        river.setAttribute('material', 'opacity:0.92; transparent:true;');
        block.appendChild(river);

        for (let side of [-1, 1]) {
            const margin = document.createElement('a-box');
            margin.setAttribute('width', BANK_WIDTH / 2 + 1);
            margin.setAttribute('height', 0.5);
            margin.setAttribute('depth', RIVER_SEGMENT_LENGTH);
            margin.setAttribute('color', '#cfab7f');
            const x = side * (this.riverWidth / 2 + (BANK_WIDTH / 4));
            margin.setAttribute('position', `${x} 0.25 0`);
            block.appendChild(margin);

            const wallHeight = 6 + Math.random() * 10;
            const xVariation = (Math.random() - 0.5) * 1.2;
            const xPosition = side * (this.riverWidth / 2 + (BANK_WIDTH / 2) + xVariation + 3 + wallHeight / 2);
            /*
                        const wall = document.createElement('a-box');
                        wall.setAttribute('width', 6);
                        wall.setAttribute('height', wallHeight);
                        wall.setAttribute('depth', RIVER_SEGMENT_LENGTH);
                        wall.setAttribute('color', '#6b4f2c');
                        wall.setAttribute('position', `${xPosition} ${wallHeight / 2} 0`);
                        block.appendChild(wall);
                        */

            const pyramid = document.createElement('a-octahedron');
            pyramid.setAttribute('radius', wallHeight);
            pyramid.setAttribute('color', '#a78a66');
            pyramid.setAttribute('position', `${xPosition} 0 0`);
            pyramid.setAttribute('rotation', `0 45 0`);
            block.appendChild(pyramid);
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

        // Gera alvos para este segmento
        if (Math.random() < TARGET_SPAWN_CHANCE) {
            this.spawnTarget(this.lastZ);
        }
    },

    spawnTarget(z) {
        // Primeiro, decide se vai ser um MISS
        let randomType;
        if (Math.random() < MISS_SPAWN_CHANCE) {
            randomType = 'MISS';
        } else {
            // Escolhe tipo de alvo regular aleatório (excluindo MISS)
            const typeKeys = Object.keys(TARGET_TYPES).filter(key => key !== 'MISS');
            randomType = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        }

        const targetType = TARGET_TYPES[randomType];

        // Posição aleatória X dentro dos limites do rio
        const xMin = this.riverCenterX - this.riverWidth / 2 + 0.5;
        const xMax = this.riverCenterX + this.riverWidth / 2 - 0.5;
        const randomX = xMin + Math.random() * (xMax - xMin);
        const randomY = 2.5 + Math.random() * 0.3; // Pequena variação em Y
        const randomZ = z + (Math.random() - 0.5) * RIVER_SEGMENT_LENGTH * 0.6;

        // Cria container do alvo
        const targetContainer = document.createElement('a-entity');
        targetContainer.setAttribute('position', `${randomX} ${randomY} ${randomZ}`);
        targetContainer.setAttribute('data-target-type', randomType);
        targetContainer.setAttribute('data-target-points', targetType.points);

        // Cria o alvo com a forma apropriada
        let targetShape;
        switch (targetType.shape) {
            case 'octahedron':
                // Cristal/diamante com octaedro
                targetShape = document.createElement('a-octahedron');
                targetShape.setAttribute('radius', targetType.radius);
                targetShape.setAttribute('color', targetType.color);
                targetShape.setAttribute('material', `emissive: ${targetType.color}; emissiveIntensity: 1.0; metalness: 0.8; roughness: 0.1;`);
                break;
            case 'cylinder':
                // Cilindro
                targetShape = document.createElement('a-cylinder');
                targetShape.setAttribute('radius', targetType.radius);
                targetShape.setAttribute('height', targetType.radius / 2);
                targetShape.setAttribute('color', targetType.color);
                targetShape.setAttribute('material', `emissive: ${targetType.color}; emissiveIntensity: 0.8; metalness: 0.9; roughness: 0.1;`);

            default:
                // Esfera normal
                targetShape = document.createElement('a-sphere');
                targetShape.setAttribute('radius', targetType.radius);
                targetShape.setAttribute('color', targetType.color);
                targetShape.setAttribute('material', `emissive: ${targetType.color}; emissiveIntensity: 0.8; metalness: 0.6; roughness: 0.2;`);
                break;
        }

        // Adiciona rotação animada
        targetShape.setAttribute('animation', `
            property: rotation;
            from: 0 0 0;
            to: 360 360 360;
            duration: 3000;
            loop: true;
            easing: linear
        `);

        targetContainer.appendChild(targetShape);

        this.el.sceneEl.appendChild(targetContainer);

        // Rastreia o alvo
        this.targets.push({
            el: targetContainer,
            z: randomZ,
            type: randomType,
            points: targetType.points,
            position: new THREE.Vector3(randomX, randomY, randomZ)
        });
    },
    removeSegment(seg) {
        if (seg.block && seg.block.parentNode) seg.block.parentNode.removeChild(seg.block);
    },
    resetRiver() {
        // Limpa todos os segmentos
        for (let seg of this.segments) {
            this.removeSegment(seg);
        }
        this.segments = [];

        // Limpa todos os alvos
        for (let target of this.targets) {
            if (target.el.parentNode) {
                target.el.parentNode.removeChild(target.el);
            }
        }
        this.targets = [];

        // Reseta variáveis de estado do rio
        this.lastZ = 0;
        this.riverCenterX = 0;
        this.riverDir = 0;
        this.riverWidth = RIVER_WIDTH;
        this.targetRiverWidth = RIVER_WIDTH;
        this.riverWidthPhase = 0;

        // Regenera os segmentos iniciais
        this.generateInitialSegments();
    }
});

// Sistema de projéteis com raycaster
class ProjectileSystem {
    constructor() {
        this.projectiles = [];
        this.projectileSpeed = 0.5;
        this.maxProjectiles = 100;
        this.scene = null;

    }

    setScene(scene) {
        this.scene = scene;

    }

    fire(position, direction, rigVelocity = new THREE.Vector3()) {


        if (this.projectiles.length >= this.maxProjectiles) {

            return;
        }

        // Cria container para o projétil + luz
        const projectileContainer = document.createElement('a-entity');
        projectileContainer.setAttribute('position', `${position.x} ${position.y} ${position.z}`);

        // Cria a esfera do projétil (aumentada de 0.1 para 0.3)
        const projectile = document.createElement('a-sphere');
        projectile.setAttribute('radius', '0.2');
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

        } else {

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

                this.projectiles.splice(i, 1);
                continue;
            }

            // Atualiza posição do projétil
            proj.position.add(proj.velocity);
            proj.el.setAttribute('position', `${proj.position.x} ${proj.position.y} ${proj.position.z}`);

        }
    }

    checkCollisionWithTarget(projectilePos, targetPos, targetRadius) {
        const distance = projectilePos.distanceTo(targetPos);
        return distance < (0.25 + targetRadius); // Raio do projétil + raio do alvo
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
        this.score = 0; // Inicializa pontuação
        this.lives = 3; // Total de vidas
        this.riverRaidProc = null; // Referência ao componente de geração do rio
        this.gameState = 'START'; // Estados: START, PLAYING, GAME_OVER

        this.el.sceneEl.addEventListener('thumbstickmoved', this.onThumbstick.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        // Eventos do gatilho do controle VR
        // meta-touch-controls dispara 'triggerdown' no sceneEl
        this.el.sceneEl.addEventListener('triggerdown', this.onTriggerDown.bind(this));



        // Aguarda a cena estar carregada
        this.el.sceneEl.addEventListener('loaded', () => {

            this.setupControllers();
            this.projectileSystem.setScene(this.el.sceneEl);
            // Obtém referência ao componente river-raid-proc
            const riverEntity = document.querySelector('[river-raid-proc]');
            if (riverEntity) {
                this.riverRaidProc = riverEntity.components['river-raid-proc'];
            }
            this.updateScoreDisplay();
            this.showVRStartPanel();

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


        // Procura pelos controllers usando as classes CSS adicionadas
        this.rightController = document.querySelector('.right-control');
        this.leftController = document.querySelector('.left-control');

        this.raycastersReady = !!(this.rightController || this.leftController);


        // Cria display de pontuação 3D no controle direito
        if (this.rightController) {
            this.createScoreDisplay(this.rightController);
        }


    },


    createScoreDisplay(controller) {
        // Cria container para o texto de pontuação
        const scoreContainer = document.createElement('a-entity');
        scoreContainer.setAttribute('position', '0 0 0');
        scoreContainer.setAttribute('rotation', '-90 0 0');

        // Cria texto 3D de score
        const scoreText = document.createElement('a-text');
        scoreText.setAttribute('value', 'score: 0');
        scoreText.setAttribute('align', 'center');
        scoreText.setAttribute('anchor', 'center');
        scoreText.setAttribute('color', '#FFD700');
        scoreText.setAttribute('font', 'mozillavr');
        scoreText.setAttribute('font-size', '5');
        scoreText.setAttribute('scale', '0.15 0.15 0.15');
        scoreText.setAttribute('material', 'emissive: #FFD700; emissiveIntensity: 0.8;alphaTest: 0.5;');
        scoreText.setAttribute('position', '-0.1 0.08 0');

        scoreContainer.appendChild(scoreText);

        // Cria texto 3D de vidas abaixo do score
        const livesText = document.createElement('a-text');
        livesText.setAttribute('value', '❤️ 3 lives');
        livesText.setAttribute('align', 'center');
        livesText.setAttribute('anchor', 'center');
        livesText.setAttribute('color', '#ff6b6b');
        livesText.setAttribute('font', 'mozillavr');
        livesText.setAttribute('font-size', '4');
        livesText.setAttribute('scale', '0.15 0.15 0.15');
        livesText.setAttribute('material', 'emissive: #ff6b6b; emissiveIntensity: 0.8;alphaTest: 0.5;');
        livesText.setAttribute('position', '0.1 0.08 0');

        scoreContainer.appendChild(livesText);
        controller.appendChild(scoreContainer);

        // Armazena referências para atualizar depois
        this.scoreTextVR = scoreText;
        this.livesTextVR = livesText;

    },

    showVRStartPanel() {
        const vrStartPanel = document.getElementById('vr-start-panel');
        if (vrStartPanel) {
            vrStartPanel.setAttribute('visible', 'true');
            this.gameState = 'START';
        }
    },

    hideVRStartPanel() {
        const vrStartPanel = document.getElementById('vr-start-panel');
        if (vrStartPanel) {
            vrStartPanel.setAttribute('visible', 'false');
        }
    },

    showVRGameOverPanel() {
        const vrGameOverPanel = document.getElementById('vr-game-over-panel');
        if (vrGameOverPanel) {
            // Atualiza score e highscore
            const vrFinalScore = document.getElementById('vr-final-score');
            if (vrFinalScore) {
                vrFinalScore.setAttribute('value', this.score);
            }

            // Carrega e atualiza highscore
            let highscore = localStorage.getItem('river-raid-highscore') || 0;
            if (this.score > highscore) {
                highscore = this.score;
                localStorage.setItem('river-raid-highscore', highscore);
            }
            const vrHighscore = document.getElementById('vr-highscore');
            if (vrHighscore) {
                vrHighscore.setAttribute('value', highscore);
            }

            vrGameOverPanel.setAttribute('visible', 'true');
        }
    },

    hideVRGameOverPanel() {
        const vrGameOverPanel = document.getElementById('vr-game-over-panel');
        if (vrGameOverPanel) {
            vrGameOverPanel.setAttribute('visible', 'false');
        }
    },

    startGame() {
        this.hideVRStartPanel();
        this.gameState = 'PLAYING';
        this.speed = CRUISE_SPEED;
        this.targetSpeed = CRUISE_SPEED;
        this.x = 0;
        this.targetX = 0;
    },

    restartGame() {






        // Limpa projéteis
        if (this.projectileSystem && this.projectileSystem.projectiles) {
            for (let proj of this.projectileSystem.projectiles) {
                if (proj.el.parentNode) {
                    proj.el.parentNode.removeChild(proj.el);
                }
            }
            this.projectileSystem.projectiles = [];
        }
        // Reseta o rio (limpa segmentos e alvos, regenera tudo)
        if (this.riverRaidProc) {
            console.log('Resetting river...');
            this.riverRaidProc.resetRiver();
        }

        // Reset do jogo
        this.score = 0;
        this.lives = 3;
        this.x = this.riverRaidProc ? this.riverRaidProc.riverCenterX : 0;
        this.targetX = 0;
        this.speed = 0;
        this.targetSpeed = CRUISE_SPEED;
        this.z = 0;




        // Atualiza display
        this.updateScoreDisplay();
        this.updateLivesDisplay();
        this.gameState = 'PLAYING';


        // Esconde painéis
        this.hideVRGameOverPanel();



    },

    loseLife(damage = 1) {
        this.lives -= damage;
        this.updateLivesDisplay();

        if (this.lives <= 0) {
            this.endGame();
        }
    },

    endGame() {
        this.showVRGameOverPanel();
        this.gameState = 'GAME_OVER';
    },

    updateLivesDisplay() {
        const livesElement = document.getElementById('lives');
        if (livesElement) {
            livesElement.textContent = this.lives;
        }
        const livesVR = document.getElementById('lives-vr');
        if (livesVR) {
            livesVR.textContent = this.lives;
        }
        // Atualiza exibição 3D de vidas na controladora
        if (this.livesTextVR) {
            this.livesTextVR.setAttribute('value', `❤️ ${this.lives} lives`);
        }
    },

    ensureControllersReady() {
        if (!this.rightController && !this.leftController) {

            this.setupControllers();
        }
        return this.rightController || this.leftController;
    },

    fireFromController(hand) {
        const controller = hand === 'right' ? this.rightController : this.leftController;


        if (!controller) {

            return;
        }

        // Verifica se o objeto3D existe
        if (!controller.object3D) {

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

        } else {
            // Fallback: usa a direção forward do objeto
            controller.object3D.getWorldDirection(direction);

        }

        // Calcula a velocidade do rig (movimento para frente em Z negativo)
        const rigVelocity = new THREE.Vector3(0, 0, -this.speed);



        // Dispara projétil com velocidade do rig
        this.projectileSystem.fire(controllerPos, direction, rigVelocity);
    },
    tick() {
        // Se o jogo não está rodando, não atualiza
        if (this.gameState !== 'PLAYING') return;

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

        // Verifica colisões com alvos
        this.checkTargetCollisions();
    },

    checkTargetCollisions() {
        if (!this.riverRaidProc || !this.riverRaidProc.targets) return;

        for (let i = this.riverRaidProc.targets.length - 1; i >= 0; i--) {
            const target = this.riverRaidProc.targets[i];
            const targetType = TARGET_TYPES[target.type];
            const targetRadius = targetType.radius;

            // Verifica colisão com cada projétil
            for (let j = this.projectileSystem.projectiles.length - 1; j >= 0; j--) {
                const proj = this.projectileSystem.projectiles[j];

                if (this.projectileSystem.checkCollisionWithTarget(proj.position, target.position, targetRadius)) {
                    // Acertou um alvo!

                    if (target.type === 'MISS') {
                        // Hit a MISS target - lose a life
                        console.log(`💀 HIT MISS! Lost a life!`);
                        this.loseLife(targetType.damage);
                    } else {
                        // Hit a regular target - gain points
                        console.log(`🎯 HIT! ${target.type} - ${target.points} points!`);
                        this.addScore(target.points);
                    }

                    // Remove alvo
                    if (target.el.parentNode) {
                        target.el.parentNode.removeChild(target.el);
                    }
                    this.riverRaidProc.targets.splice(i, 1);

                    // Remove projétil
                    if (proj.el.parentNode) {
                        proj.el.parentNode.removeChild(proj.el);
                    }
                    this.projectileSystem.projectiles.splice(j, 1);
                    break;
                }
            }

            // Verifica colisão do jogador com o alvo
            const cameraRig = document.querySelector('#cameraRig');
            if (cameraRig) {
                const playerPos = new THREE.Vector3();
                cameraRig.object3D.getWorldPosition(playerPos);

                // Calcula distância entre o jogador e o alvo
                const distance = playerPos.distanceTo(target.position);
                const collisionThreshold = targetRadius + 1; // 0.3 = raio aproximado do jogador

                if (distance < collisionThreshold) {
                    // Colidiu com o alvo!
                    console.log(`💥 CRASH! Hit ${target.type}! Lost a life!`);
                    this.loseLife(1);

                    // Remove alvo
                    if (target.el.parentNode) {
                        target.el.parentNode.removeChild(target.el);
                    }
                    this.riverRaidProc.targets.splice(i, 1);
                }
            }
        }
    },

    addScore(points) {
        this.score += points;
        this.updateScoreDisplay();
    },

    updateScoreDisplay() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
        // Atualiza também o texto VR se existir
        if (this.scoreTextVR) {
            this.scoreTextVR.setAttribute('value', `score: ${this.score}`);
        }
    },
    onThumbstick(evt) {
        // Se o jogo não está rodando, ignora input
        if (this.gameState !== 'PLAYING') return;

        // x: lateral, y: frente/trás (aqui y controla velocidade)
        const { x, y } = evt.detail;
        this.joystickX = Math.abs(x) > 0.05 ? x : 0;
        this.joystickY = Math.abs(y) > 0.05 ? -y : 0;
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
        if (evt.key === ' ') {
            // Só dispara se o jogo está em PLAYING
            if (this.gameState !== 'PLAYING') return;

            evt.preventDefault();
            // Fire from camera position
            const camPos = new THREE.Vector3();
            this.el.object3D.getWorldPosition(camPos);
            const direction = new THREE.Vector3(0, 0, -1);
            const rigVelocity = new THREE.Vector3(0, 0, -this.speed);
            this.projectileSystem.fire(camPos, direction, rigVelocity);
        }

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
        // Verifica se o painel de START está visível
        const vrStartPanel = document.getElementById('vr-start-panel');
        if (vrStartPanel && vrStartPanel.getAttribute('visible') === true) {
            this.startGame();
            return;
        }

        // Verifica se o painel de GAME OVER está visível
        const vrGameOverPanel = document.getElementById('vr-game-over-panel');
        if (vrGameOverPanel && vrGameOverPanel.getAttribute('visible') === true) {
            this.restartGame();
            return;
        }

        // Se nenhum painel está visível e o jogo está em PLAYING, dispara normalmente
        if (this.gameState !== 'PLAYING') {
            return;
        }

        if (!this.ensureControllersReady()) {
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
            this.fireFromController(hand);
        }
    }
});

