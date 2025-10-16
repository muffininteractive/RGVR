// Import physics configuration
import { PhysicsConfig, applyPhysicsMaterial } from './physics-config.js';

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

        // Aplica as configurações globais de mundo do PhysicsConfig na cena
        // this.applyWorldPhysicsConfig();

        // Event listeners
        document.addEventListener('level-play', this.startPhysics.bind(this));
        document.addEventListener('level-restart', this.restartLevel.bind(this));
        document.addEventListener('level-objective-reached', this.onObjectiveReached.bind(this));

    },

    // Aplica PhysicsConfig.world na cena (gravidade, iterações/solver, broadphase)
    /*
    applyWorldPhysicsConfig: function () {
        const scene = this.el.sceneEl || this.el;
        const worldCfg = (typeof PhysicsConfig !== 'undefined' && PhysicsConfig && PhysicsConfig.world) ? PhysicsConfig.world : null;
        if (!scene || !worldCfg) return;

        // 1) Define a gravidade via atributo do sistema de física
        try {
            const gravityY = Number(worldCfg.gravity);
            if (!isNaN(gravityY)) {
                const current = scene.getAttribute('physics') || {};
                const next = Object.assign({}, current, { gravity: { x: 0, y: gravityY, z: 0 } });
                scene.setAttribute('physics', next);
            }
        } catch (e) {
            console.warn('[level-manager] Falha ao setar gravidade na cena:', e);
        }

        // 2) Ajustes finos no CANNON.World após a cena carregar
        const tune = () => this._tuneCannonWorld(worldCfg);
        if (scene.hasLoaded) tune();
        else scene.addEventListener('loaded', tune, { once: true });
    },

    // Ajustes diretos no CANNON.World (iterações do solver, broadphase, tipo de solver)
    _tuneCannonWorld: function (worldCfg) {
        const scene = this.el.sceneEl || this.el;
        const physicsSystem = scene && scene.systems && scene.systems.physics;
        const driver = physicsSystem && physicsSystem.driver;
        const cannonWorld = driver && driver.world;

        if (!cannonWorld || typeof CANNON === 'undefined') return;

        // Gravidade (garantia extra)
        if (typeof worldCfg.gravity === 'number') {
            cannonWorld.gravity.set(0, worldCfg.gravity, 0);
        }

        // Iterações do solver
        const iters = (typeof worldCfg.solverIterations === 'number') ? worldCfg.solverIterations : worldCfg.iterations;
        if (iters && cannonWorld.solver) {
            cannonWorld.solver.iterations = iters;
        }

        // Broadphase
        if (worldCfg.broadphase) {
            const name = String(worldCfg.broadphase).toLowerCase();
            if (name.includes('sap') && CANNON.SAPBroadphase) {
                cannonWorld.broadphase = new CANNON.SAPBroadphase(cannonWorld);
            } else if (CANNON.NaiveBroadphase) {
                cannonWorld.broadphase = new CANNON.NaiveBroadphase();
            }
        }

        // Tipo de solver
        if (worldCfg.solver) {
            const s = String(worldCfg.solver).toLowerCase();
            if (s.includes('gs') && CANNON.GSSolver) {
                cannonWorld.solver = new CANNON.GSSolver();
                if (iters) cannonWorld.solver.iterations = iters;
            } else if (s.includes('split') && CANNON.SplitSolver && CANNON.GSSolver) {
                cannonWorld.solver = new CANNON.SplitSolver(new CANNON.GSSolver());
                if (iters) cannonWorld.solver.iterations = iters;
            }
        }

        console.log('🌍 Physics world configurado:', {
            gravity: cannonWorld.gravity,
            iterations: cannonWorld.solver && cannonWorld.solver.iterations,
            broadphase: cannonWorld.broadphase && cannonWorld.broadphase.constructor && cannonWorld.broadphase.constructor.name,
            solver: cannonWorld.solver && cannonWorld.solver.constructor && cannonWorld.solver.constructor.name
        });
    },
*/
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

    // Helper function to get physics config for element type
    getPhysicsConfigForType: function (type) {
        const configMap = {
            'sphere': PhysicsConfig.objects.sphere,
            'cube': PhysicsConfig.objects.cube,
            'cylinder': PhysicsConfig.objects.cylinder,
            'cone': PhysicsConfig.objects.cone,
            'torus': PhysicsConfig.objects.torus,
            'lever': PhysicsConfig.objects.lever,
            'ramp': PhysicsConfig.objects.ramp,
            'platform': PhysicsConfig.objects.platform,
            'domino': PhysicsConfig.objects.domino, // Usa configuração de cubo
            'button': PhysicsConfig.objects.cube, // Usa configuração de cubo
            'model': PhysicsConfig.objects.model // Default para modelos genéricos

        };
        return configMap[type] || null;
    },

    getMaterialConfig: function (materialName) {
        return PhysicsConfig.materials[materialName] || null;
    },

    // Apply physics configuration from physics-config.js
    applyPhysicsConfig: function (element, data) {
        const physicsConfig = this.getMaterialConfig(data.body.material) || this.getPhysicsConfigForType(data.type);
        console.log('Applying physics config:', data.body.material, physicsConfig);
        if (!physicsConfig) {
            console.warn(`No physics config found for type: ${data.type}`);
            return;
        }

        // Store physics config for later use when physics starts
        element.dataset.physicsType = data.body.type;
        element.dataset.physicsMass = data.body?.mass || physicsConfig.mass;
        element.dataset.physicsRestitution = data.body?.restitution || physicsConfig.restitution;
        element.dataset.physicsFriction = data.body?.friction || physicsConfig.friction;
        element.dataset.physicsMaterial = data.body?.material || physicsConfig.material;

        // Store damping if available
        if (physicsConfig.linearDamping !== undefined) {
            element.dataset.physicsLinearDamping = physicsConfig.linearDamping;
        }
        if (physicsConfig.angularDamping !== undefined) {
            element.dataset.physicsAngularDamping = physicsConfig.angularDamping;
        }

        console.log(`📦 Physics config applied to ${data.id}:`, {
            type: data.type,
            mass: element.dataset.physicsMass,
            material: element.dataset.physicsMaterial
        });
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

            case 'model':
                // Generic GLTF/GLB model loader
                element = document.createElement('a-entity');
                if (data.modelUrl) {
                    const url = String(data.modelUrl).trim();
                    // Allow both asset id (e.g. #myModel) or direct URL
                    element.setAttribute('gltf-model', url.startsWith('#') ? url : `url(${url})`);
                }
                if (data.scale) {
                    element.setAttribute('scale', data.scale);
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
        // Avoid forcing color on generic entities (like GLTF roots)
        if (data.color && element.tagName !== 'A-ENTITY') {
            element.setAttribute('color', data.color);
        }
        element.setAttribute('shadow', 'cast: true; receive: true');

        // Rotation (if exists)
        if (data.rotation) {
            element.setAttribute('rotation', data.rotation);
        }

        // Física baseada no novo formato
        const isGltfModel = data.type === 'model' || (element.hasAttribute && element.hasAttribute('gltf-model'));
        const physicsType = data.body?.type;




        // Movable element component (se não for fixed)
        if (!data.fixed) {
            element.setAttribute('movable-element', '');
            element.classList.add('interactive');
            element.classList.add('grab');

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

        // Apply physics configuration from physics-config.js
        this.applyPhysicsConfig(element, data);

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
        const scene = this.el.sceneEl;
        levelState.physicsEnabled = true;
        levelState.attemptCount++;

        // Aplicar configuração de física para cada elemento do nível
        if (levelState.levelData && levelState.levelData.elements) {
            levelState.levelData.elements.forEach(data => {
                const element = document.querySelector(`#${data.id}`);
                if (element && data.body) {
                    // Get physics config from dataset or use from physics-config.js
                    const bodyConfig = {
                        type: data.body.type || 'dynamic',
                        mass: parseFloat(element.dataset.physicsMass) || data.body.mass || 50,
                        restitution: parseFloat(element.dataset.physicsRestitution) || data.body.restitution || 0.3,
                        friction: parseFloat(element.dataset.physicsFriction) || data.body.friction || 0.5,

                    };

                    // Add damping if available
                    if (element.dataset.physicsLinearDamping) {
                        bodyConfig.linearDamping = parseFloat(element.dataset.physicsLinearDamping);
                    }
                    if (element.dataset.physicsAngularDamping) {
                        bodyConfig.angularDamping = parseFloat(element.dataset.physicsAngularDamping);
                    }
                    if (element.dataset.contactEquationStiffness) {
                        bodyConfig.contactEquationStiffness = parseFloat(element.dataset.contactEquationStiffness);
                    }
                    if (element.dataset.contactEquationRelaxation) {
                        bodyConfig.contactEquationRelaxation = parseFloat(element.dataset.contactEquationRelaxation);
                    }

                    // Apply body configuration using correct A-Frame Physics attributes
                    const bodyType = bodyConfig.type;
                    delete bodyConfig.type; // Remove type from config object

                    if (bodyType === 'static') {
                        element.setAttribute('static-body', bodyConfig);
                        console.log(`🎮 Static physics applied to ${data.id}:`, bodyConfig);
                    } else {
                        element.setAttribute('dynamic-body', bodyConfig);
                        console.log(`🎮 Dynamic physics applied to ${data.id}:`, bodyConfig);
                    }

                    // Apply physics material after body is loaded
                    const materialName = element.dataset.physicsMaterial;
                    if (materialName) {
                        element.addEventListener('body-loaded', (evt) => {
                            if (evt.target.body) {
                                try {
                                    applyPhysicsMaterial(evt.target.body, materialName);
                                    console.log(`✅ Material '${materialName}' aplicado ao ${data.id}`);
                                } catch (error) {
                                    console.warn(`⚠️ Erro ao aplicar material físico:`, error);
                                }
                            }
                        }, { once: true });
                    }
                }
            });
        }



        // Remove possibilidade de mover objetos
        levelState.movableObjects.forEach(obj => {
            obj.removeAttribute('movable-element');
            obj.classList.remove('interactive');
            obj.classList.remove('grab');

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

AFRAME.registerComponent('movable-element', {
    init: function () {
        // Store initial scale for later reset
        this.initialScale = this.el.getAttribute('scale') || { x: 1, y: 1, z: 1 };
        // Drag state and config (mouse)
        this.isDragging = false;
        this.grabDistance = 1.5;
        this.initialGrabDistance = 1.5;
        this.grabOffset = new THREE.Vector3();
        this.minDistance = 1;
        this.maxDistance = 30;
        this.wheelSpeed = 0.01; // distance change per wheel delta unit

        this.el.addEventListener('mousedown', this.onGrab.bind(this));
        this.el.addEventListener('mouseup', this.onRelease.bind(this));
        this.el.addEventListener('touchstart', this.onGrab.bind(this), { passive: true });
        this.el.addEventListener('touchend', this.onRelease.bind(this));
        this.el.addEventListener('mouseenter', this.onHover.bind(this));
        this.el.addEventListener('mouseleave', this.onUnhover.bind(this));

        // Bind global handlers for release/wheel while dragging
        this._onDocMouseUp = this.onRelease.bind(this);
        this._onWheel = this.onWheel.bind(this);
        window.addEventListener('mouseup', this._onDocMouseUp);
        window.addEventListener('wheel', this._onWheel, { passive: false });
    },
    onGrab: function (evt) {
        // Start dragging only with primary mouse button when using mouse
        // Touch is handled too via touchstart
        console.log(evt);
        if (evt && evt.type === 'mousedown' && evt.detail.mouseEvent.button !== 0) return;

        // Initialize grab based on current mouse ray
        const ray = this.getCurrentMouseRay();
        if (!ray) return;

        // World positions
        const objPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(objPos);

        // Distance from ray origin to object
        this.grabDistance = ray.origin.distanceTo(objPos);
        this.initialGrabDistance = this.grabDistance;

        // Compute offset from the ray line at that distance
        const rayPoint = ray.origin.clone().add(ray.direction.clone().multiplyScalar(this.grabDistance));
        this.grabOffset.copy(objPos).sub(rayPoint);

        // Clamp distance
        this.grabDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.grabDistance));

        // Visual feedback
        this.createBouncingCone(this.el);
        this.el.setAttribute('animation', 'property: scale; to: 1.1 1.1 1.1; dur: 200; easing: easeOutQuad');

        this.isDragging = true;

    },
    onRelease: function () {
        if (this.isDragging) {
            this.isDragging = false;
        }
        this.removeBouncingCone(this.el);
        this.el.setAttribute('animation', `property: scale; to: ${this.initialScale.x} ${this.initialScale.y} ${this.initialScale.z}; dur: 200; easing: easeOutQuad`);
    },
    onHover: function () {
        this.createBouncingCone(this.el);
        this.el.setAttribute('animation', 'property: scale; to: 1.1 1.1 1.1; dur: 200; easing: easeOutQuad');
    },
    onUnhover: function () {
        this.removeBouncingCone(this.el);
        this.el.setAttribute('animation', `property: scale; to: ${this.initialScale.x} ${this.initialScale.y} ${this.initialScale.z}; dur: 200; easing: easeOutQuad`);
    },

    onWheel: function (evt) {
        if (!this.isDragging) return;
        // Adjust distance with wheel; negative deltaY = zoom in (closer)
        this.grabDistance -= evt.deltaY * this.wheelSpeed;
        this.grabDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.grabDistance));
        // Prevent page scroll while dragging
        evt.preventDefault();
    },

    getCurrentMouseRay: function () {

        const sceneEl = this.el.sceneEl;
        if (!sceneEl) return null;
        // Prefer the cursor entity's raycaster (rayOrigin: mouse)
        const cursorEl = sceneEl.querySelector('[cursor]');
        const raycasterComp = cursorEl && cursorEl.components && cursorEl.components.raycaster;
        if (raycasterComp && raycasterComp.raycaster && raycasterComp.raycaster.ray) {
            const ray = raycasterComp.raycaster.ray;
            return {
                origin: ray.origin.clone(),
                direction: ray.direction.clone().normalize()
            };
        }
        // Fallback to camera forward ray
        const camera = sceneEl.camera;
        if (!camera) return null;
        const origin = new THREE.Vector3();
        const direction = new THREE.Vector3();
        camera.getWorldPosition(origin);
        camera.getWorldDirection(direction); // forward direction
        return { origin, direction: direction.clone().normalize() };
    },

    createBouncingCone: function (object) {
        // Remove cone anterior se existir
        this.removeBouncingCone(object);

        // Cria o cone verde
        const cone = document.createElement('a-cone');
        cone.setAttribute('color', '#00FF00');
        cone.setAttribute('radius-bottom', '0.5');
        cone.setAttribute('radius-top', '0');
        cone.setAttribute('height', '0.9');
        cone.setAttribute('rotation', '180 0 0'); // Rotacionado em X=180
        cone.classList.add('feedback-cone');

        // Posiciona o cone acima do objeto
        const objectPos = object.object3D.position;
        const boundingBox = new THREE.Box3().setFromObject(object.object3D);
        const height = boundingBox.max.y - boundingBox.min.y;

        cone.setAttribute('position', `0 ${height / 2 + 0.3} 0`);

        // Adiciona animação de bouncing
        cone.setAttribute('animation', {
            property: 'position',
            to: `0 ${height / 2 + 0.5} 0`,
            dur: 500,
            dir: 'alternate',
            loop: true,
            easing: 'easeInOutQuad'
        });

        // Adiciona o cone como filho do objeto
        object.appendChild(cone);
    },

    removeBouncingCone: function (object) {
        if (object) {
            const existingCone = object.querySelector('.feedback-cone');
            if (existingCone) {
                object.removeChild(existingCone);
            }
        }
    },

    tick: function () {
        if (!this.isDragging) return;
        const ray = this.getCurrentMouseRay();
        if (!ray) return;

        // Target point along the ray at current distance
        const targetPos = ray.origin.clone().add(ray.direction.clone().multiplyScalar(this.grabDistance));

        // Scale offset proportionally to distance change
        const distanceRatio = this.initialGrabDistance > 0 ? (this.grabDistance / this.initialGrabDistance) : 1;
        const scaledOffset = this.grabOffset.clone().multiplyScalar(distanceRatio);
        targetPos.add(scaledOffset);

        // Prevent going below floor: keep bottom of object at >= 0
        const geometry = this.el.object3D.children[0]?.geometry;
        let objectHeight = 0;
        if (geometry) {
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            if (bbox) {
                objectHeight = (bbox.max.y - bbox.min.y) * this.el.object3D.scale.y / 2;
            }
        }
        const minY = objectHeight;
        if (targetPos.y < minY) targetPos.y = minY;

        this.el.object3D.position.set(targetPos.x, targetPos.y, targetPos.z);
    },

    remove: function () {
        // Cleanup global listeners
        if (this._onDocMouseUp) window.removeEventListener('mouseup', this._onDocMouseUp);
        if (this._onWheel) window.removeEventListener('wheel', this._onWheel);
    }


});

AFRAME.registerComponent('grab-handler', {
    init: function () {
        this.grabbedObject = null;
        this.grabDistance = 1.5; // Distância inicial do objeto ao controle
        this.initialGrabDistance = 1.5; // Guarda a distância inicial
        this.grabOffset = new THREE.Vector3(); // Offset do objeto em relação ao controle
        this.minDistance = 1;
        this.maxDistance = 30;
        this.distanceSpeed = 0.1;

        // Eventos de trigger (gatilho)
        this.el.addEventListener('triggerdown', this.onTriggerDown.bind(this));
        this.el.addEventListener('triggerup', this.onTriggerUp.bind(this));

        // Evento de thumbstick para controlar distância (no controle específico)

        this.el.addEventListener('thumbstickmoved', this.onThumbstickMoved.bind(this));

        // Eventos do raycaster para hover
        this.el.addEventListener('raycaster-intersection', this.onRaycasterIntersection.bind(this));
        this.el.addEventListener('raycaster-intersection-cleared', this.onRaycasterIntersectionCleared.bind(this));

    },

    onRaycasterIntersection: function (evt) {
        // Quando o raycaster intersecta com um objeto
        const intersectedEls = evt.detail.els;
        if (intersectedEls && intersectedEls.length > 0) {
            const object = intersectedEls[0];
            if (object.classList.contains('grab')) {
                // Cria cone verde bouncing sobre o objeto
                this.createBouncingCone(object);
            }
        }
    },

    onRaycasterIntersectionCleared: function (evt) {
        // Quando o raycaster para de intersectar com um objeto
        const clearedEls = evt.detail.clearedEls;
        if (clearedEls && clearedEls.length > 0) {
            clearedEls.forEach(object => {
                if (object.classList.contains('grab') && object !== this.grabbedObject) {
                    object.setAttribute('material', 'emissiveIntensity', 0);
                    // Remove cone de feedback se existir
                    this.removeBouncingCone(object);
                }
            });
        }
    },

    createBouncingCone: function (object) {
        // Remove cone anterior se existir
        this.removeBouncingCone(object);

        // Cria o cone verde
        const cone = document.createElement('a-cone');
        cone.setAttribute('color', '#00FF00');
        cone.setAttribute('radius-bottom', '0.5');
        cone.setAttribute('radius-top', '0');
        cone.setAttribute('height', '0.9');
        cone.setAttribute('rotation', '180 0 0'); // Rotacionado em X=180
        cone.classList.add('feedback-cone');

        // Posiciona o cone acima do objeto
        const objectPos = object.object3D.position;
        const boundingBox = new THREE.Box3().setFromObject(object.object3D);
        const height = boundingBox.max.y - boundingBox.min.y;

        cone.setAttribute('position', `0 ${height / 2 + 0.3} 0`);

        // Adiciona animação de bouncing
        cone.setAttribute('animation', {
            property: 'position',
            to: `0 ${height / 2 + 0.5} 0`,
            dur: 500,
            dir: 'alternate',
            loop: true,
            easing: 'easeInOutQuad'
        });

        // Adiciona o cone como filho do objeto
        object.appendChild(cone);
    },

    removeBouncingCone: function (object) {
        if (object) {
            const existingCone = object.querySelector('.feedback-cone');
            if (existingCone) {
                object.removeChild(existingCone);
            }
        }
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
        /*
        if (feedback) {
            feedback.setAttribute('value', `Grabbed! Distance: ${this.grabDistance.toFixed(2)}m`);
            setTimeout(() => {
                feedback.setAttribute('value', '');
            }, 1500);
        }
        */

        // Clamp da distância
        this.grabDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.grabDistance));

        // Para animações se houver
        object.removeAttribute('animation');
        object.removeAttribute('animation__position');
        object.removeAttribute('animation__rotation');

        // Cria cone verde bouncing sobre o objeto capturado
        this.createBouncingCone(object);

        console.log('Objeto capturado. Posição:', objPos, 'Distância:', this.grabDistance, 'Offset:', this.grabOffset);
    },

    releaseObject: function () {
        if (this.grabbedObject) {
            // Remove cone de feedback
            this.removeBouncingCone(this.grabbedObject);

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
