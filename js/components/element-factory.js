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
            'wall': PhysicsConfig.objects.wall,
            'seesaw': PhysicsConfig.objects.seesaw,
            'swing': PhysicsConfig.objects.swing
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
        element.dataset.physicsCustomShape2 = data.customShape2 || physicsConfig.customShape2 || '';
        element.dataset.physicsCustomBody = data.body || '';
        //element.dataset.physicsSphereRadius = data.body?.sphereRadius || 0.4;
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
                element.setAttribute('radius', data.radius || 0.4);
                element.setAttribute('material', 'repeat: 2 1;roughness: 0.1; metalness: 0.3;');
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
                element.setAttribute('material', 'repeat: 1 0.5;');
                break;

            case 'model':
                element = document.createElement('a-entity');
                if (data.modelUrl) {
                    const url = String(data.modelUrl).trim();
                    element.setAttribute('gltf-model', url.startsWith('#') ? url : `url(${url})`);
                }
                // Scale será definido no final da função
                break;

            case 'ramp':
                element = document.createElement('a-box');
                if (data.dimensions) {
                    element.setAttribute('width', data.dimensions.width || 4);
                    element.setAttribute('height', data.dimensions.height || 0.3);
                    element.setAttribute('depth', data.dimensions.depth || 3);
                }
                element.setAttribute('material', 'repeat: 2 0.1;');
                break;

            case 'platform':
                element = document.createElement('a-box');
                if (data.dimensions) {
                    element.setAttribute('width', data.dimensions.width);
                    element.setAttribute('height', data.dimensions.height);
                    element.setAttribute('depth', data.dimensions.depth);
                }
                const targetPlane = document.createElement('a-plane');
                targetPlane.setAttribute('width', data.dimensions.width);
                targetPlane.setAttribute('height', data.dimensions.height);
                targetPlane.setAttribute('rotation', `${data.rotation?.x || 0} ${data.rotation?.y || 0} ${data.rotation?.z || 0}`);
                targetPlane.setAttribute('position', `${data.position.x} ${data.position.y} ${data.position.z + data.dimensions.depth / 2 + 0.01}`);
                targetPlane.setAttribute('color', '#000000');
                targetPlane.setAttribute('opacity', '0.5');


                const targetText = document.createElement('a-text');
                targetText.setAttribute('value', 'TARGET');
                targetText.setAttribute('color', '#FFFFFF');
                targetText.setAttribute('align', 'center');
                targetText.setAttribute('z-offset', '0.01');
                targetPlane.appendChild(targetText);
                const scene = document.querySelector('a-scene');
                scene.appendChild(targetPlane);

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
                element.setAttribute('gltf-model', 'url(../assets/models/cannon.glb)');
                // Scale será definido no final da função
                if (!data.body) data.body = {};
                data.body.shape = 'none';
                element.setAttribute('body', data.body || 'shape:none');
                element.setAttribute('cannon-activator', '');
                break;

            case 'candle':
                element = document.createElement('a-cylinder');
                element.classList.add('candle');
                element.setAttribute('radius', data.radius || 0.2);
                element.setAttribute('height', data.height || 1.5);
                element.setAttribute('color', '#FFFCCB');
                // Não define position aqui, será definido no final da função
                element.setAttribute('minY', data.minY || '0.75');

                const flame = document.createElement('a-plane');
                flame.setAttribute('width', '0.4');
                flame.setAttribute('height', '0.5');
                flame.setAttribute('position', `0 ${data.height / 2 + 0.25 || 1} 0`);
                flame.setAttribute('material', { "src": "#flameTex", "transparent": true });
                flame.setAttribute('flame-anim', '');
                flame.setAttribute('look-at', '[camera]');
                element.appendChild(flame);
                break;

            case 'cylinder':
                element = document.createElement('a-cylinder');
                element.setAttribute('radius', data.radius || 0.4);
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
            case 'seesaw':
                element = document.createElement('a-entity');
                // Não define position aqui, será definido no final da função

                if (!data.body) data.body = {};
                data.body.shape = 'none';
                element.setAttribute('body', 'type:static;mass:50;shape:none');

                const base = document.createElement('a-box');
                base.setAttribute('id', "seesaw-base");
                base.setAttribute('position', '0 0 0');
                base.setAttribute('width', 0.5);
                base.setAttribute('height', 0.1);
                base.setAttribute('depth', 0.5);
                base.setAttribute('color', '#ff0000');

                base.setAttribute('body', 'type:static; mass:0; restitution:0.3; friction:0.8;');

                const piramid = document.createElement('a-tetrahedron');
                piramid.setAttribute('position', '0 0.25 0');
                piramid.setAttribute('rotation', '0 -45 0');
                piramid.setAttribute('radius', 0.45);
                piramid.setAttribute('color', '#ffffff');
                piramid.setAttribute('body', 'type:static;shape:none; mass:0; restitution:0.3; friction:0.8;');



                const plank = document.createElement('a-box');
                plank.setAttribute('width', data.dimensions?.width || 4);
                plank.setAttribute('height', data.dimensions?.height || 0.1);
                plank.setAttribute('depth', data.dimensions?.depth || 0.5);

                plank.setAttribute('color', '#ffa600');
                plank.setAttribute('body', 'type:dynamic;shape:box; mass:10; restitution:0.3; friction:2;');
                plank.setAttribute('constraint', 'type: hinge;target: #seesaw-base;axis: 0 0 1;targetAxis: 0 0 1; pivot: 0 0 0; targetPivot: 0 0.5 0;');

                // Torna o plank interativo/móvel
                if (data.movable) {
                    plank.classList.add('interactive');
                    base.classList.add('interactive');
                    piramid.classList.add('interactive');
                }

                element.appendChild(base);
                element.appendChild(piramid);
                element.appendChild(plank);

                break;
            case 'swing':
                element = document.createElement('a-entity');
                // Não define position aqui, será definido no final da função

                if (!data.body) data.body = {};
                data.body.shape = 'none';
                element.setAttribute('body', 'shape: none;type:static;mass:50;shape:none');



                const swingBase = document.createElement('a-box');
                swingBase.setAttribute('id', "swing-base");
                swingBase.setAttribute('position', '0 0 0');
                swingBase.setAttribute('width', 3);
                swingBase.setAttribute('height', 0.1);
                swingBase.setAttribute('depth', 2.5);
                swingBase.setAttribute('color', '#A0522D');
                swingBase.setAttribute('body', 'type:static; mass:0; restitution:0.3; friction:0.8;');

                const swingPole = document.createElement('a-box');
                swingPole.setAttribute('id', "swing-pole");
                swingPole.setAttribute('position', '0 0 1');
                swingPole.setAttribute('width', 0.1);
                swingPole.setAttribute('height', 1.5);
                swingPole.setAttribute('depth', 0.5);
                swingPole.setAttribute('color', '#D2691E');
                swingPole.setAttribute('body', 'type:dynamic; mass:8; restitution:0.3; friction:0.8;');

                swingPole.setAttribute('constraint', 'type: hinge; target: #swing-base; pivot: 0 0 0; targetPivot: 0 0 0;collideConnected: false');
                //swingPole.setAttribute('constraint__top', 'type: pointToPoint; target: #swing-base; pivot: 0 1 0; targetPivot: 0 1 0;');

                const hammer = document.createElement('a-cylinder');
                hammer.setAttribute('radius', 0.1);
                hammer.setAttribute('height', 0.2);
                hammer.setAttribute('position', '0 -0.75 0');
                hammer.setAttribute('rotation', '0 0 90');
                hammer.setAttribute('color', '#808080');


                swingPole.appendChild(hammer);

                const hammer2 = document.createElement('a-cylinder');
                hammer2.setAttribute('radius', 0.1);
                hammer2.setAttribute('height', 0.2);
                hammer2.setAttribute('position', '0 0.75 0');
                hammer2.setAttribute('rotation', '0 0 90');
                hammer2.setAttribute('color', '#808080');


                swingPole.appendChild(hammer2);


                // Torna o swingPole interativo/móvel
                if (data.movable) {
                    swingPole.classList.add('interactive');
                    swingBase.classList.add('interactive');
                }

                element.appendChild(swingBase);
                element.appendChild(swingPole);


                break;
            default:
                console.warn(`Unknown element type: ${data.type}`);
                return null;
        }

        if (data.isTarget) {
            element.classList.add('target-element');
            element.setAttribute('material', {
                emissive: '#00ff00',
                emissiveIntensity: 0.0
            });
            element.setAttribute('animation', {
                property: 'material.emissiveIntensity',
                to: 0.8,
                dur: 1000,
                dir: 'alternate',
                loop: true
            });



        }

        // Propriedades básicas
        element.setAttribute('id', data.id);

        // Converte position para string se for objeto, ou usa valor padrão
        if (data.position) {
            if (typeof data.position === 'object' && data.position !== null) {
                const x = parseFloat(data.position.x) || 0;
                const y = parseFloat(data.position.y) || 0;
                const z = parseFloat(data.position.z) || 0;

                // Valida se há valores NaN
                if (isNaN(x) || isNaN(y) || isNaN(z)) {
                    console.warn(`⚠️ Invalid position values for ${data.id}, using default:`, data.position);
                    element.setAttribute('position', '0 0 0');
                } else {
                    element.setAttribute('position', `${x} ${y} ${z}`);
                }
            } else {
                element.setAttribute('position', data.position);
            }
        } else {
            // Valor padrão se position não foi fornecido
            element.setAttribute('position', '0 0 0');
        }

        // Rotação (se existir)
        if (data.rotation) {
            // Converte rotation para string se for objeto
            if (typeof data.rotation === 'object' && data.rotation !== null) {
                const x = parseFloat(data.rotation.x) || 0;
                const y = parseFloat(data.rotation.y) || 0;
                const z = parseFloat(data.rotation.z) || 0;

                // Valida se há valores NaN
                if (isNaN(x) || isNaN(y) || isNaN(z)) {
                    console.warn(`⚠️ Invalid rotation values for ${data.id}, using default:`, data.rotation);
                    element.setAttribute('rotation', '0 0 0');
                } else {
                    element.setAttribute('rotation', `${x} ${y} ${z}`);
                }
            } else {
                element.setAttribute('rotation', data.rotation);
            }
        }

        // Scale (se existir)
        if (data.scale) {
            if (typeof data.scale === 'object' && data.scale !== null) {
                const x = parseFloat(data.scale.x) || 1;
                const y = parseFloat(data.scale.y) || 1;
                const z = parseFloat(data.scale.z) || 1;

                // Valida se há valores NaN
                if (isNaN(x) || isNaN(y) || isNaN(z)) {
                    console.warn(`⚠️ Invalid scale values for ${data.id}, using default:`, data.scale);
                    element.setAttribute('scale', '1 1 1');
                } else {
                    element.setAttribute('scale', `${x} ${y} ${z}`);
                }
            } else {
                element.setAttribute('scale', data.scale);
            }
        }

        // Eixo de rotação customizado
        if (data.rotateAxis) {
            element.setAttribute('rotateaxis', data.rotateAxis);
        }

        // Evita forçar cor em entidades genéricas (como raízes GLTF)
        if (data.color && element.tagName !== 'A-ENTITY') {
            element.setAttribute('color', data.color);
        }

        // Aplica textura se fornecida
        if (data.objTexture && data.objTexture.trim() !== '') {
            const textureValue = data.objTexture.trim();
            // Verifica se é um ID (começa com #) ou uma URL
            const src = textureValue.startsWith('#') ? textureValue : `url(${textureValue})`;
            element.setAttribute('material', `src: ${src};shader: flat;`);
        }

        element.setAttribute('shadow', 'cast: true; receive: false');



        // Componente de elemento móvel (se não for fixo)
        if (data.movable) {

            element.setAttribute('movable-element', '');
            element.classList.add('interactive');

            element.setAttribute('material', {
                emissive: '#ffffff',
                emissiveIntensity: 0
            });
            /*
            if (data.body.type !== 'static')
                element.setAttribute('dynamic-body', data.body);
            else {
                element.setAttribute('static-body', data.body);
            }
            */

        }

        // Marca elementos especiais
        if (data.isStart) {
            element.classList.add('start-element');
            element.setAttribute('material', {
                emissive: data.color,
                emissiveIntensity: 0.3
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

        // Define o atributo canFinish
        if (data.canFinish) {
            element.setAttribute('can-finish', 'true');
            element.dataset.canFinish = 'true';
        }

        this.applyPhysicsToElement(element, data, applyPhysicsMaterial);
        // Força o carregamento do corpo rígido
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
            type: data.body.type || 'static',
            mass: 0,
            sphereRadius: element.dataset.physicsSphereRadius || data.body.sphereRadius || data.radius || 0.4,
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
        if (element.dataset.physicsCustomShape2) {
            element.setAttribute('body', 'shape: none;');
            element.setAttribute('shape__custom2', element.dataset.physicsCustomShape2);
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
        //delete bodyConfig.type; // Remove type do objeto config

        element.setAttribute('body', bodyConfig);
        //element.removeAttribute('static-body');
        /*
        if (bodyType === 'static') {
            element.setAttribute('static-body', bodyConfig);
            console.log(`🎮 Static physics applied to ${data.id}:`, bodyConfig);
        } else if (bodyType === 'dynamic') {
            element.setAttribute('dynamic-body', bodyConfig);
            console.log(`🎮 Dynamic physics applied to ${data.id}:`, bodyConfig);
        }
*/


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

    static startDynamicBodyApplication(element, data) {

        if (element || data.body) {

            element.body.mass = element.dataset.physicsMass || data.body.mass || 1;
            //element.body.type = CANNON.Body.DYNAMIC;
            element.body.updateMassProperties();
            console.log(`✅ Dynamic body started for start element ${data.id}:`, {
                mass: element.body.mass,
                type: element.body.type
            });

        } else {
            if (element.isStart) {
                console.log(`⚠️ Element or body data missing for start element ${data.id}`);
            }
        }
    }
}

export { ElementFactory };
