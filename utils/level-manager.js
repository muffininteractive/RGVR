// Level Manager - Level management system
// Controls physics, elements, objective detection and game flow

import { SceneManager } from './scene-manager.js';

// Global level state
let levelState = {
    currentLevel: null,
    levelData: null,
    physicsEnabled: false,
    objectiveReached: false,
    movableObjects: [],
    startElements: [],
    targetElement: null,
    attemptCount: 0
};

// Main level management component
AFRAME.registerComponent('level-manager', {
    schema: {
        levelId: { type: 'number', default: 1 }
    },

    init: function () {
        this.levelId = this.data.levelId;
        this.loadLevelData();

        // Event listeners
        document.addEventListener('level-play', this.startPhysics.bind(this));
        document.addEventListener('level-restart', this.restartLevel.bind(this));
        document.addEventListener('level-objective-reached', this.onObjectiveReached.bind(this));
    },

    loadLevelData: async function () {
        try {
            const response = await fetch('../data/levels-data.json');
            const data = await response.json();

            levelState.levelData = data.levels.find(level => level.id === this.levelId);

            if (levelState.levelData) {
                levelState.currentLevel = this.levelId;
                console.log(`✅ Level ${this.levelId} loaded:`, levelState.levelData.name);

                // Create level elements
                this.createLevelElements();

                // Update UI with objective
                this.updateObjectiveUI();
            } else {
                console.error(`❌ Level ${this.levelId} not found`);
            }
        } catch (error) {
            console.error('❌ Error loading level data:', error);
        }
    },

    createLevelElements: function () {
        const scene = this.el.sceneEl;
        const elements = levelState.levelData.elements;

        elements.forEach((elementData) => {
            const element = this.createElement(elementData);
            if (element) {
                scene.appendChild(element);

                // Register special elements
                if (elementData.movable) {
                    levelState.movableObjects.push(element);
                }
                if (elementData.isStart) {
                    levelState.startElements.push(element);
                }
                if (elementData.isTarget) {
                    levelState.targetElement = element;
                    element.setAttribute('target-detector', '');
                }
            }
        });

        console.log(`✅ ${elements.length} elements created for the level`);
    },

    createElement: function (data) {
        let element;

        switch (data.type) {
            case 'sphere':
                element = document.createElement('a-sphere');
                element.setAttribute('radius', data.radius || 0.5);
                break;

            case 'cube':
                element = document.createElement('a-box');
                if (data.dimensions) {
                    element.setAttribute('width', data.dimensions.width);
                    element.setAttribute('height', data.dimensions.height);
                    element.setAttribute('depth', data.dimensions.depth);
                }
                break;

            case 'ramp':
            case 'platform':
                element = document.createElement('a-box');
                if (data.dimensions) {
                    element.setAttribute('width', data.dimensions.width);
                    element.setAttribute('height', data.dimensions.height);
                    element.setAttribute('depth', data.dimensions.depth);
                }
                break;

            case 'domino':
                element = document.createElement('a-box');
                if (data.dimensions) {
                    element.setAttribute('width', data.dimensions.width);
                    element.setAttribute('height', data.dimensions.height);
                    element.setAttribute('depth', data.dimensions.depth);
                }
                break;

            case 'lever':
                element = document.createElement('a-box');
                if (data.dimensions) {
                    element.setAttribute('width', data.dimensions.width);
                    element.setAttribute('height', data.dimensions.height);
                    element.setAttribute('depth', data.dimensions.depth);
                }
                break;

            case 'cylinder':
                if (data.movable && !data.fixed) {
                    element.setAttribute('movable-element', '');
                    element.classList.add('interactive');


                    // Visual feedback for movable elements
                    element.setAttribute('material', {
                        emissive: '#ffffff',
                        emissiveIntensity: 0
                    });
                }
                element = document.createElement('a-cylinder');
                element.setAttribute('radius', data.radius || 0.5);
                element.setAttribute('height', data.height || 1);
                break;

            case 'button':
                element = document.createElement('a-box');
                if (data.dimensions) {
                    element.setAttribute('width', data.dimensions.width);
                    element.setAttribute('height', data.dimensions.height);
                    element.setAttribute('depth', data.dimensions.depth);
                }
                break;

            default:
                console.warn(`Unknown element type: ${data.type}`);
                return null;
        }

        // Basic properties
        element.setAttribute('id', data.id);
        element.setAttribute('position', data.position);
        element.setAttribute('color', data.color);
        element.setAttribute('shadow', 'cast: true; receive: true');

        // Rotation (if exists)
        if (data.rotation) {
            element.setAttribute('rotation', data.rotation);
        }

        // Física baseada em phyType
        if (data.phyType === 'static-body') {
            element.setAttribute('static-body', '');
        } else if (data.phyType === 'dynamic-body') {
            let dynBodyOpts = {};
            if (data.physics) {
                dynBodyOpts.mass = data.physics.mass || 1;
                dynBodyOpts.linearDamping = data.physics.linearDamping || 0.1;
                dynBodyOpts.angularDamping = data.physics.angularDamping || 0.1;
            }
            element.setAttribute('dynamic-body', dynBodyOpts);
            // SEMPRE desabilita a física até apertar Play (inclusive a bola/start)
            // Usa a forma (name, property, value) para não sobrescrever config do corpo
            element.setAttribute('dynamic-body', 'enabled', false);

            // Guarda massa original para restaurar no Play
            const originalMass = dynBodyOpts.mass ?? 1;
            try {
                element.dataset.originalMass = String(originalMass);
            } catch (e) {
                // dataset pode não estar disponível em alguns contextos; ignora silenciosamente
            }

            // Assim que o corpo carregar, força a ficar estático/parado até o Play
            element.addEventListener('body-loaded', (evt) => {
                const body = evt.target.body;
                if (body && window.CANNON) {
                    // Torna o corpo estático para não cair
                    body.type = CANNON.Body.STATIC;
                    body.mass = 0;
                    body.updateMassProperties();
                    // Zera velocidades e garante "sono"
                    body.velocity.set(0, 0, 0);
                    body.angularVelocity.set(0, 0, 0);
                    body.sleep && body.sleep();
                }
            });
            // Propriedades físicas extras
            if (data.physics && data.physics.restitution !== undefined) {
                element.addEventListener('body-loaded', (evt) => {
                    if (evt.target.body) {
                        evt.target.body.material.restitution = data.physics.restitution;
                    }
                });
            }
            if (data.physics && data.physics.friction !== undefined) {
                element.addEventListener('body-loaded', (evt) => {
                    if (evt.target.body) {
                        evt.target.body.material.friction = data.physics.friction;
                    }
                });
            }
        }

        // Movable element component (se não for fixed)
        if (!data.fixed) {
            element.setAttribute('movable-element', '');
            element.classList.add('interactive');

            // Visual feedback para elementos móveis
            element.setAttribute('material', {
                emissive: '#ffffff',
                emissiveIntensity: 0
            });
        }

        // Mark special elements
        if (data.isStart) {
            element.classList.add('start-element');
            element.setAttribute('material', {
                emissive: data.color,
                emissiveIntensity: 0.3
            });
        }

        if (data.isTarget) {
            element.classList.add('target-element');
            element.setAttribute('material', {
                emissive: '#00ff00',
                emissiveIntensity: 0.5
            });
            element.setAttribute('animation', {
                property: 'material.emissiveIntensity',
                to: 0.8,
                dur: 1000,
                dir: 'alternate',
                loop: true
            });
        }

        return element;
    },

    updateObjectiveUI: function () {
        const objectiveText = document.querySelector('#objective-text');
        if (objectiveText && levelState.levelData) {
            objectiveText.setAttribute('value', `${levelState.levelData.objective}`);
        }
    },

    startPhysics: function () {
        console.log('▶️ Iniciando física do nível...');

        levelState.physicsEnabled = true;
        levelState.attemptCount++;

        // Ativa física em todos os elementos dinâmicos corretamente
        const dynamicElements = this.el.sceneEl.querySelectorAll('[dynamic-body]');
        dynamicElements.forEach(element => {
            // Reativa o componente dynamic-body
            element.setAttribute('dynamic-body', 'enabled: true');

            // Se o corpo já existir, acorda o corpo e zera velocidades para iniciar sem impulso extra
            if (element.body) {
                const body = element.body;
                // Restaura para dinâmico
                if (window.CANNON) {
                    body.type = CANNON.Body.DYNAMIC;
                }
                // Restaura massa original
                const originalMass = parseFloat(element.dataset?.originalMass || '1');
                body.mass = isNaN(originalMass) ? 1 : originalMass;
                body.updateMassProperties();

                // Garante que começa sem velocidades residuais
                body.velocity.set(0, 0, 0);
                body.angularVelocity.set(0, 0, 0);
                body.wakeUp && body.wakeUp();
            } else {
                // Se ainda não carregou, ao carregar, ajustar os estados
                element.addEventListener('body-loaded', () => {
                    if (!element.body) return;
                    const body = element.body;
                    if (window.CANNON) {
                        body.type = CANNON.Body.DYNAMIC;
                    }
                    const originalMass = parseFloat(element.dataset?.originalMass || '1');
                    body.mass = isNaN(originalMass) ? 1 : originalMass;
                    body.updateMassProperties();
                    body.velocity.set(0, 0, 0);
                    body.angularVelocity.set(0, 0, 0);
                    body.wakeUp && body.wakeUp();
                }, { once: true });
            }
        });



        // Remove possibilidade de mover objetos
        levelState.movableObjects.forEach(obj => {
            obj.removeAttribute('movable-element');
            obj.classList.remove('interactive');

        });

        // Desabilita botão Play
        const playBtn = document.querySelector('#btn-play');
        if (playBtn) {
            playBtn.setAttribute('vr-button', 'disabled: true');
        }

        // Habilita botão Restart
        const restartBtn = document.querySelector('#btn-restart');
        if (restartBtn) {
            restartBtn.setAttribute('vr-button', 'disabled: false');
            restartBtn.setAttribute('visible', true);
        }

        console.log('✅ Física ativada!');
    },

    restartLevel: function () {
        console.log('🔄 Reiniciando nível...');

        // Recarrega a página para resetar completamente
        location.reload();
    },

    onObjectiveReached: function (evt) {
        if (levelState.objectiveReached) return; // Evita múltiplas detecções

        levelState.objectiveReached = true;
        console.log('🎉 OBJETIVO ATINGIDO!');

        // Emite evento de vitória
        this.el.sceneEl.emit('level-complete', {
            levelId: this.levelId,
            attempts: levelState.attemptCount
        });

        // Mostra UI de vitória
        this.showVictoryUI();

        // Salva progresso
        this.saveProgress();
    },

    showVictoryUI: function () {
        const victoryPanel = document.querySelector('#victory-panel');
        if (victoryPanel) {
            victoryPanel.setAttribute('visible', true);
            victoryPanel.setAttribute('animation', {
                property: 'scale',
                from: '0 0 0',
                to: '1 1 1',
                dur: 500,
                easing: 'easeOutElastic'
            });
        }

        // Update stats
        const statsText = document.querySelector('#victory-stats');
        if (statsText) {
            statsText.setAttribute('value', `Attempts: ${levelState.attemptCount}`);
        }
    },

    saveProgress: function () {
        try {
            const completedLevels = JSON.parse(localStorage.getItem('rgvr-completed-levels') || '[]');

            if (!completedLevels.includes(this.levelId)) {
                completedLevels.push(this.levelId);
                localStorage.setItem('rgvr-completed-levels', JSON.stringify(completedLevels));
                console.log('💾 Progress saved');
            }
        } catch (error) {
            console.error('❌ Error saving progress:', error);
        }
    }
});

// Component for movable elements before starting
AFRAME.registerComponent('movable-element', {
    init: function () {
        this.isDragging = false;
        this.isVRGrabbing = false;
        this.activeController = null; // a-entity do controle responsável pelo grab
        this.originalPosition = this.el.getAttribute('position');
        // Plano de arrasto orientado à câmera (XY de tela)
        this.viewPlane = null; // THREE.Plane perpendicular à direção da câmera
        this.grabOffset = null; // THREE.Vector3: offset entre ponto de interseção e o centro do objeto
        this.raycaster = new AFRAME.THREE.Raycaster();
        this.tmpVec3 = new AFRAME.THREE.Vector3();
        this.camera = null;
        // Ray atual
        this.rayOrigin = new AFRAME.THREE.Vector3();
        this.rayDir = new AFRAME.THREE.Vector3();

        // Profundidade ao longo do raio
        this.grabDistance = 1.5;
        this.initialGrabDistance = 1.5;
        this.minDistance = 0.2;
        this.maxDistance = 15;
        this.distanceSpeed = 0.05; // quanto o thumbstick altera por frame de evento

        // Ponteiro em NDC
        this.pointerNDC = { x: 0, y: 0 };

        // Handlers vinculados para add/remove
        this._onPointerMove = this.onPointerMove.bind(this);
        this._onWindowUp = this.onRelease.bind(this);
        this._onThumbstickMoved = this.onThumbstickMoved.bind(this);

        // Event listeners
        this.el.addEventListener('mousedown', this.onGrab.bind(this));
        this.el.addEventListener('mouseup', this.onRelease.bind(this));
        this.el.addEventListener('touchstart', this.onGrab.bind(this), { passive: true });
        this.el.addEventListener('touchend', this.onRelease.bind(this));
        this.el.addEventListener('mouseenter', this.onHover.bind(this));
        this.el.addEventListener('mouseleave', this.onUnhover.bind(this));

        // For VR
        this.el.addEventListener('gripdown', this.onGrab.bind(this));
        this.el.addEventListener('gripup', this.onRelease.bind(this));

        // Thumbstick para ajustar profundidade
        if (this.el.sceneEl) {
            this.el.sceneEl.addEventListener('thumbstickmoved', this._onThumbstickMoved);
            // Captura gatilhos dos controles em nível de cena
            this._onTriggerDown = this.onControllerTriggerDown.bind(this);
            this._onTriggerUp = this.onControllerTriggerUp.bind(this);
            this.el.sceneEl.addEventListener('triggerdown', this._onTriggerDown);
            this.el.sceneEl.addEventListener('triggerup', this._onTriggerUp);
        }
    },
    remove: function () {
        // Limpa listeners globais caso o elemento seja removido
        if (this.el && this.el.sceneEl) {
            this.el.sceneEl.removeEventListener('thumbstickmoved', this._onThumbstickMoved);
            this.el.sceneEl.removeEventListener('triggerdown', this._onTriggerDown);
            this.el.sceneEl.removeEventListener('triggerup', this._onTriggerUp);
        }
        window.removeEventListener('mousemove', this._onPointerMove);
        window.removeEventListener('mouseup', this._onWindowUp);
        window.removeEventListener('touchmove', this._onPointerMove);
        window.removeEventListener('touchend', this._onWindowUp);
    },

    onHover: function () {
        if (!levelState.physicsEnabled) {
            this.el.setAttribute('material', 'emissiveIntensity', 0.3);
        }
    },

    onUnhover: function () {
        if (!this.isDragging && !levelState.physicsEnabled) {
            this.el.setAttribute('material', 'emissiveIntensity', 0);
        }
    },

    onGrab: function (evt) {
        if (levelState.physicsEnabled) return;

        // Garante câmera/canvas
        const scene = this.el.sceneEl;
        this.camera = scene.camera || this.camera;
        if (!this.camera) return;

        const THREE = AFRAME.THREE;
        const worldPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(worldPos);

        // Se estiver em VR, o grab via ponteiro deve ser ignorado; será tratado por onControllerTriggerDown
        if (scene.is('vr-mode')) {
            return;
        }

        // Desktop: usa ponteiro
        this.updatePointerNDCFromEvent(evt);
        this.raycaster.setFromCamera(this.pointerNDC, this.camera); // Ray da câmera pelo ponteiro
        this.rayOrigin.copy(this.raycaster.ray.origin);
        this.rayDir.copy(this.raycaster.ray.direction);

        // Distância inicial ao longo do raio até o objeto (projeção)
        const toObj = new THREE.Vector3().subVectors(worldPos, this.rayOrigin);
        const t = Math.max(this.minDistance, Math.min(this.maxDistance, this.rayDir.dot(toObj)));
        this.grabDistance = t;
        this.initialGrabDistance = t;

        // Plano perpendicular à direção do ray localizado em origin + dir * distancia
        this.updateViewPlane(this.rayOrigin, this.rayDir);

        // Interseção do ray com o plano para evitar snap
        const interPoint = new THREE.Vector3();
        const hit = this.raycaster.ray.intersectPlane(this.viewPlane, interPoint);
        if (hit) {
            this.grabOffset = new THREE.Vector3().subVectors(worldPos, interPoint);
        } else {
            this.grabOffset = new THREE.Vector3(0, 0, 0);
        }

        this.isDragging = true;
        this.isVRGrabbing = false;
        this.activeController = null;
        this.el.setAttribute('material', 'emissiveIntensity', 0.5);
        // Listeners globais para acompanhar o arrasto
        window.addEventListener('mousemove', this._onPointerMove);
        window.addEventListener('mouseup', this._onWindowUp);
        window.addEventListener('touchmove', this._onPointerMove, { passive: true });
        window.addEventListener('touchend', this._onWindowUp);

        console.log('🤏 Elemento agarrado:', this.el.id);
    },

    onRelease: function () {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.el.setAttribute('material', 'emissiveIntensity', 0);
        console.log('👋 Elemento solto:', this.el.id);

        // Remove listeners de arrasto
        window.removeEventListener('mousemove', this._onPointerMove);
        window.removeEventListener('mouseup', this._onWindowUp);
        window.removeEventListener('touchmove', this._onPointerMove);
        window.removeEventListener('touchend', this._onWindowUp);
        this.viewPlane = null;
        this.grabOffset = null;
        this.isVRGrabbing = false;
        this.activeController = null;
    },

    // Atualiza posição enquanto arrastando
    onPointerMove: function (evt) {
        if (!this.isDragging) return;
        // Em desktop, atualiza NDC do ponteiro e o ray
        if (!this.isVRGrabbing) {
            this.updatePointerNDCFromEvent(evt);
            this.raycaster.setFromCamera(this.pointerNDC, this.camera);
            this.rayOrigin.copy(this.raycaster.ray.origin);
            this.rayDir.copy(this.raycaster.ray.direction);
        }
    },

    // Atualiza NDC do ponteiro a partir do evento
    updatePointerNDCFromEvent: function (evt) {
        const scene = this.el.sceneEl;
        const canvas = scene.canvas || scene.renderer?.domElement;
        if (!canvas) {
            this.pointerNDC.x = 0; this.pointerNDC.y = 0; return;
        }
        if (evt && (evt.clientX !== undefined || (evt.touches && evt.touches[0]))) {
            const point = evt.touches && evt.touches[0] ? evt.touches[0] : evt;
            const rect = canvas.getBoundingClientRect();
            this.pointerNDC.x = ((point.clientX - rect.left) / rect.width) * 2 - 1;
            this.pointerNDC.y = -((point.clientY - rect.top) / rect.height) * 2 + 1;
        } else {
            // fallback centro da tela (ex.: VR sem ponteiro de tela)
            this.pointerNDC.x = 0;
            this.pointerNDC.y = 0;
        }
    },

    // Atualiza o plano de arrasto baseado no ray atual (origem/direção) e distância
    // Se origin/dir não forem passados, usa a câmera como fallback (desktop)
    updateViewPlane: function (origin, dir) {
        const THREE = AFRAME.THREE;
        let o = origin;
        let d = dir;
        if (!o || !d) {
            if (!this.camera) return;
            const camPos = new THREE.Vector3();
            const camDir = new THREE.Vector3();
            this.camera.getWorldPosition(camPos);
            this.camera.getWorldDirection(camDir);
            o = camPos;
            d = camDir;
        }
        const planePoint = o.clone().add(d.clone().multiplyScalar(this.grabDistance));
        this.viewPlane = new THREE.Plane();
        this.viewPlane.setFromNormalAndCoplanarPoint(d, planePoint);
    },

    // Define posição do elemento em world space com segurança (respeita hierarquia)
    setWorldPosition: function (worldPos) {
        const THREE = AFRAME.THREE;
        const obj = this.el.object3D;
        const local = worldPos.clone();
        if (obj.parent) obj.parent.worldToLocal(local);
        this.el.setAttribute('position', local);

        // Se houver corpo físico já criado, sincroniza também
        if (this.el.body) {
            this.el.body.position.set(worldPos.x, worldPos.y, worldPos.z);
            if (this.el.body.velocity) this.el.body.velocity.set(0, 0, 0);
            if (this.el.body.angularVelocity) this.el.body.angularVelocity.set(0, 0, 0);
            this.el.body.sleep && this.el.body.sleep();
        }
    },

    // Ajusta a distância ao longo do ray via thumbstick
    onThumbstickMoved: function (evt) {
        if (!this.isDragging) return;
        const y = evt.detail?.y ?? 0;
        if (Math.abs(y) <= 0.05) return;
        this.grabDistance -= y * this.distanceSpeed * 10; // acelera um pouco
        this.grabDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.grabDistance));
        if (this.isVRGrabbing && this.activeController) {
            const origin = new AFRAME.THREE.Vector3();
            const dir = new AFRAME.THREE.Vector3();
            this.activeController.object3D.getWorldPosition(origin);
            this.activeController.object3D.getWorldDirection(dir);
            dir.negate();
            this.updateViewPlane(origin, dir);
        } else {
            this.updateViewPlane(this.rayOrigin, this.rayDir);
        }
        // Evita que outros handlers (ex.: move-events) usem este input enquanto arrastando
        if (evt.stopPropagation) evt.stopPropagation();
        if (evt.stopImmediatePropagation) evt.stopImmediatePropagation();
    },

    // Trigger no controle inicia/termina o grab quando este objeto está sob o raycaster
    onControllerTriggerDown: function (evt) {
        if (levelState.physicsEnabled) return;
        const scene = this.el.sceneEl;
        if (!scene || !scene.is('vr-mode')) return; // só VR

        const controller = evt.target; // entidade do controle
        const rc = controller.components?.raycaster;
        if (!rc) return;
        const intersections = rc.intersections || [];
        if (!intersections.length) return;
        const top = intersections[0];
        const targetEl = top.object?.el;
        if (targetEl !== this.el) return; // só pega se este objeto for o alvo mais próximo

        // Configura ray a partir do controle
        const THREE = AFRAME.THREE;
        const worldPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(worldPos);

        const origin = new THREE.Vector3();
        const dir = new THREE.Vector3();
        controller.object3D.getWorldPosition(origin);
        controller.object3D.getWorldDirection(dir);
        dir.negate(); // laser-controls aponta -Z local

        this.rayOrigin.copy(origin);
        this.rayDir.copy(dir);

        // Distância projetada
        const toObj = new THREE.Vector3().subVectors(worldPos, this.rayOrigin);
        const t = Math.max(this.minDistance, Math.min(this.maxDistance, this.rayDir.dot(toObj)));
        this.grabDistance = t;
        this.initialGrabDistance = t;

        // Atualiza plano perpendicular à direção do ray na distância atual
        this.updateViewPlane(this.rayOrigin, this.rayDir);

        // Ponto de interseção do ray com o plano e offset
        const interPoint = new THREE.Vector3();
        const hit = new AFRAME.THREE.Ray(this.rayOrigin.clone(), this.rayDir.clone()).intersectPlane(this.viewPlane, interPoint);
        this.grabOffset = hit ? new THREE.Vector3().subVectors(worldPos, interPoint) : new THREE.Vector3(0, 0, 0);

        this.isDragging = true;
        this.isVRGrabbing = true;
        this.activeController = controller;
        this.el.setAttribute('material', 'emissiveIntensity', 0.5);
    },

    onControllerTriggerUp: function () {
        if (!this.isDragging || !this.isVRGrabbing) return;
        this.onRelease();
    },

    tick: function () {
        if (!this.isDragging || !this.viewPlane) return;

        const THREE = AFRAME.THREE;
        let inter = new THREE.Vector3();
        let hasHit = false;

        if (this.isVRGrabbing && this.activeController) {
            // Atualiza ray a partir do controle ativo
            const origin = new THREE.Vector3();
            const dir = new THREE.Vector3();
            this.activeController.object3D.getWorldPosition(origin);
            this.activeController.object3D.getWorldDirection(dir);
            dir.negate();

            this.rayOrigin.copy(origin);
            this.rayDir.copy(dir);

            // Reposiciona o plano na nova orientação/distância atual
            this.updateViewPlane(this.rayOrigin, this.rayDir);
            hasHit = new THREE.Ray(this.rayOrigin.clone(), this.rayDir.clone()).intersectPlane(this.viewPlane, inter) !== null;
        } else if (this.camera) {
            // Desktop: usa câmera + último NDC
            this.raycaster.setFromCamera(this.pointerNDC, this.camera);
            const ray = this.raycaster.ray;
            // Atualiza o plano com base no ray atual da câmera
            this.updateViewPlane(ray.origin, ray.direction);
            hasHit = ray.intersectPlane(this.viewPlane, inter) !== null;
        }

        if (!hasHit) return;
        const targetWorld = inter.clone();
        if (this.grabOffset) targetWorld.add(this.grabOffset);
        this.setWorldPosition(targetWorld);
    }
});

// Objective detector component
AFRAME.registerComponent('target-detector', {
    init: function () {
        this.collisionCount = 0;

        // Detect collisions
        this.el.addEventListener('collide', this.onCollision.bind(this));
    },

    onCollision: function (evt) {
        if (!levelState.physicsEnabled || levelState.objectiveReached) return;

        const collidedWith = evt.detail.body.el;

        // Check if collided with start element or other relevant elements
        if (collidedWith && (
            collidedWith.classList.contains('start-element') ||
            collidedWith.hasAttribute('dynamic-body')
        )) {
            this.collisionCount++;
            console.log(`🎯 Collision detected on target! (${this.collisionCount}x)`);

            // Wait a bit to ensure it's a valid collision
            setTimeout(() => {
                if (this.collisionCount > 0) {
                    document.dispatchEvent(new CustomEvent('level-objective-reached'));
                }
            }, 500);
        }
    }
});

export { levelState };
