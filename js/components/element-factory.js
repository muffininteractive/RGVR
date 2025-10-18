// Element Factory - Responsável pela criação de elementos e aplicação de física
import { PhysicsConfig, applyPhysicsMaterial } from '../physics-config.js';

class ElementFactory {
    /**
     * Obtém a configuração de física para um tipo de elemento
     * @param {string} type - Tipo do elemento
     * @returns {object} Configuração de física
     */
    static getPhysicsConfigForType(type) {
        const configMap = {
            'sphere': PhysicsConfig.objects.sphere,
            'cube': PhysicsConfig.objects.cube,
            'cylinder': PhysicsConfig.objects.cylinder,
            'cone': PhysicsConfig.objects.cone,
            'torus': PhysicsConfig.objects.torus,
            'candle': PhysicsConfig.objects.candle,
            'lever': PhysicsConfig.objects.lever,
            'ramp': PhysicsConfig.objects.ramp,
            'platform': PhysicsConfig.objects.platform,
            'domino': PhysicsConfig.objects.domino,
            'button': PhysicsConfig.objects.cube,
            'cannon': PhysicsConfig.objects.cannon,
            'model': PhysicsConfig.objects.model,
            'wall': PhysicsConfig.objects.wall
        };
        return configMap[type] || null;
    }

    /**
     * Obtém a configuração de material
     * @param {string} materialName - Nome do material
     * @returns {object} Configuração do material
     */
    static getMaterialConfig(materialName) {
        return PhysicsConfig.materials[materialName] || null;
    }

    /**
     * Aplica configuração de física a um elemento
     * @param {Element} element - Elemento A-Frame
     * @param {object} data - Dados do elemento do nível
     */
    static applyPhysicsConfig(element, data) {
        const physicsConfig = this.getMaterialConfig(data.body.material) || this.getPhysicsConfigForType(data.type);

        if (!physicsConfig) {
            console.warn(`No physics config found for type: ${data.type}`);
            return;
        }

        // Armazena configuração de física para uso posterior
        element.dataset.physicsType = data.body.type;
        element.dataset.physicsShape = data.body?.shape || physicsConfig.shape || 'auto';
        element.dataset.physicsCustomShape = data.customShape || physicsConfig.customShape || '';
        element.dataset.physicsCustomBody = data.body || '';
        element.dataset.physicsSphereRadius = data.body?.sphereRadius || 0.5;
        element.dataset.physicsCylinderAxis = data.body?.cylinderAxis || 'z';
        element.dataset.physicsMass = data.body?.mass || physicsConfig.mass;
        element.dataset.physicsRestitution = data.body?.restitution || physicsConfig.restitution;
        element.dataset.physicsFriction = data.body?.friction || physicsConfig.friction;
        element.dataset.physicsMaterial = data.body?.material || physicsConfig.material;

        // Armazena damping se disponível
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
    }

    /**
     * Cria um elemento baseado nos dados do nível
     * @param {object} data - Dados do elemento
     * @returns {Element} Elemento A-Frame criado
     */
    static createElement(data) {
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

            case 'wall':
                element = document.createElement('a-box');
                if (data.dimensions) {
                    element.setAttribute('width', data.dimensions.width);
                    element.setAttribute('height', data.dimensions.height);
                    element.setAttribute('depth', data.dimensions.depth);
                }
                break;

            case 'model':
                element = document.createElement('a-entity');
                if (data.modelUrl) {
                    const url = String(data.modelUrl).trim();
                    element.setAttribute('gltf-model', url.startsWith('#') ? url : `url(${url})`);
                }
                if (data.scale) {
                    element.setAttribute('scale', data.scale);
                }
                break;

            case 'ramp':
                element = document.createElement('a-box');
                if (data.dimensions) {
                    element.setAttribute('width', data.dimensions.width);
                    element.setAttribute('height', data.dimensions.height);
                    element.setAttribute('depth', data.dimensions.depth);
                }
                break;

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

            case 'cannon':
                element = document.createElement('a-entity');
                if (data.modelUrl) {
                    const url = String(data.modelUrl).trim();
                    element.setAttribute('gltf-model', url.startsWith('#') ? url : `url(${url})`);
                }
                if (data.scale) {
                    element.setAttribute('scale', data.scale);
                }
                element.setAttribute('cannon-activator', '');
                break;

            case 'candle':
                element = document.createElement('a-cylinder');
                element.classList.add('candle');
                element.setAttribute('radius', data.radius || 0.5);
                element.setAttribute('height', data.height || 1);

                const flame = document.createElement('a-plane');
                flame.setAttribute('width', '0.4');
                flame.setAttribute('height', '0.5');
                flame.setAttribute('position', `0 ${data.height / 2 + 0.25 || 1.8} 0`);
                flame.setAttribute('material', { "src": "#flameTex", "transparent": true });
                flame.setAttribute('flame-anim', '');
                flame.setAttribute('look-at', '[camera]');
                element.appendChild(flame);
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

        // Propriedades básicas
        element.setAttribute('id', data.id);
        element.setAttribute('position', data.position);

        // Evita forçar cor em entidades genéricas (como raízes GLTF)
        if (data.color && element.tagName !== 'A-ENTITY') {
            element.setAttribute('color', data.color);
        }
        element.setAttribute('shadow', 'cast: true; receive: false');

        // Rotação (se existir)
        if (data.rotation) {
            element.setAttribute('rotation', data.rotation);
        }

        // Componente de elemento móvel (se não for fixo)
        if (data.movable) {
            element.setAttribute('movable-element', '');
            element.classList.add('interactive');
            element.classList.add('grab');
            element.setAttribute('material', {
                emissive: '#ffffff',
                emissiveIntensity: 0
            });
        }

        // Marca elementos especiais
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

        // Aplica configuração de física
        this.applyPhysicsConfig(element, data);

        // Define limites customizados se fornecidos
        if (typeof data.minY !== 'undefined') {
            element.dataset.minY = data.minY;
        }
        if (typeof data.maxY !== 'undefined') {
            element.dataset.maxY = data.maxY;
        }
        if (typeof data.minX !== 'undefined') {
            element.dataset.minX = data.minX;
        }
        if (typeof data.maxX !== 'undefined') {
            element.dataset.maxX = data.maxX;
        }

        return element;
    }

    /**
     * Aplica física ao elemento durante o início do nível
     * @param {Element} element - Elemento A-Frame
     * @param {object} data - Dados do elemento do nível
     * @param {object} applyPhysicsMaterialFn - Função para aplicar material de física
     */
    static applyPhysicsToElement(element, data, applyPhysicsMaterialFn) {
        if (!element || !data.body) {
            return;
        }

        // Obtém configuração de física do dataset ou do physics-config.js
        const bodyConfig = {
            type: data.body.type || 'dynamic',
            mass: element.dataset.physicsMass || data.body.mass || 1,
            sphereRadius: element.dataset.physicsSphereRadius || data.body.sphereRadius || 0.5,
            cylinderAxis: element.dataset.physicsCylinderAxis || data.body.cylinderAxis || 'z',
            restitution: parseFloat(element.dataset.physicsRestitution) || data.body.restitution || 0.3,
            friction: parseFloat(element.dataset.physicsFriction) || data.body.friction || 0.5,
        };

        if (element.dataset.physicsShape) {
            bodyConfig.shape = element.dataset.physicsShape;
        }

        if (element.dataset.physicsCustomShape) {
            element.setAttribute('body', 'shape: none;');
            element.setAttribute('shape__custom', element.dataset.physicsCustomShape);
        }

        // Adiciona damping se disponível
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

        // Aplica configuração de corpo usando atributos corretos de A-Frame Physics
        const bodyType = bodyConfig.type;
        delete bodyConfig.type; // Remove type do objeto config

        if (bodyType === 'static') {
            element.setAttribute('static-body', bodyConfig);
            console.log(`🎮 Static physics applied to ${data.id}:`, bodyConfig);
        } else {
            element.setAttribute('dynamic-body', bodyConfig);
            console.log(`🎮 Dynamic physics applied to ${data.id}:`, bodyConfig);
        }

        // Aplica material de física após o corpo ser carregado
        const materialName = element.dataset.physicsMaterial;
        if (materialName && applyPhysicsMaterialFn) {
            element.addEventListener('body-loaded', (evt) => {
                if (evt.target.body) {
                    try {
                        applyPhysicsMaterialFn(evt.target.body, materialName);
                        console.log(`✅ Material '${materialName}' aplicado ao ${data.id}`);
                    } catch (error) {
                        console.warn(`⚠️ Erro ao aplicar material físico:`, error);
                    }
                }
            }, { once: true });
        }
    }
}

export { ElementFactory };
