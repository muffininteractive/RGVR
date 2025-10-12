// Tutorial System - RGVR
import { SceneManager } from '../utils/scene-manager.js';

// Estado do tutorial
let tutorialState = {
    currentStep: 1,
    maxSteps: 3,
    completed: false,
    objectsConnected: [],
    startObject: null,
    middleObject: null,
    endObject: null
};

// Componente para destacar objetos do tutorial
AFRAME.registerComponent('tutorial-highlight', {
    schema: {
        type: { type: 'string', default: 'start' }
    },

    init: function() {
        this.originalColor = this.el.getAttribute('color');
        this.highlightColor = this.getHighlightColor();
        this.isHighlighted = false;
        
        // Adiciona glow effect
        this.el.setAttribute('material', {
            color: this.originalColor,
            emissive: '#001122',
            emissiveIntensity: 0.3
        });

        this.startHighlight();
    },

    getHighlightColor: function() {
        switch(this.data.type) {
            case 'start': return '#FF8888';
            case 'middle': return '#88CCFF';
            case 'end': return '#88FF88';
            default: return '#FFFFFF';
        }
    },

    startHighlight: function() {
        this.el.setAttribute('animation__highlight', {
            property: 'material.emissiveIntensity',
            to: 0.8,
            dur: 1500,
            dir: 'alternate',
            loop: true
        });
    },

    stopHighlight: function() {
        this.el.removeAttribute('animation__highlight');
        this.el.setAttribute('material.emissiveIntensity', 0.1);
    }
});

// Componente para gerenciar pegar objetos no tutorial
AFRAME.registerComponent('tutorial-grab-handler', {
    init: function() {
        this.grabbedObject = null;
        
        this.el.addEventListener('triggerdown', this.onTriggerDown.bind(this));
        this.el.addEventListener('triggerup', this.onTriggerUp.bind(this));
    },

    onTriggerDown: function() {
        if (this.grabbedObject) return;

        const raycasterComponent = this.el.components.raycaster;
        if (!raycasterComponent) return;

        const intersections = raycasterComponent.intersections;
        if (intersections && intersections.length > 0) {
            const intersection = intersections[0];
            const object = intersection.object.el;

            if (object && object.classList.contains('grab')) {
                this.grabObject(object);
                TutorialManager.onObjectGrabbed(object);
            }
        }
    },

    onTriggerUp: function() {
        if (this.grabbedObject) {
            TutorialManager.onObjectReleased(this.grabbedObject);
            this.releaseObject();
        }
    },

    grabObject: function(object) {
        this.grabbedObject = object;
        
        // Visual feedback
        const originalColor = object.getAttribute('color');
        object.setAttribute('color', '#FFFFFF');
        object.originalColor = originalColor;

        // Remove animações
        object.removeAttribute('animation');
        object.removeAttribute('animation__highlight');
    },

    releaseObject: function() {
        if (this.grabbedObject) {
            // Restaura cor original
            if (this.grabbedObject.originalColor) {
                this.grabbedObject.setAttribute('color', this.grabbedObject.originalColor);
            }
            
            this.grabbedObject = null;
        }
    },

    tick: function() {
        if (this.grabbedObject) {
            // Simples follow do objeto
            const controllerPos = new THREE.Vector3();
            const controllerDir = new THREE.Vector3();

            this.el.object3D.getWorldPosition(controllerPos);
            this.el.object3D.getWorldDirection(controllerDir);
            
            controllerDir.negate();
            const targetPos = controllerPos.clone().add(controllerDir.multiplyScalar(1.5));
            
            // Mantém acima do chão
            if (targetPos.y < 0.5) targetPos.y = 0.5;
            
            this.grabbedObject.object3D.position.set(targetPos.x, targetPos.y, targetPos.z);
        }
    }
});

// Componente para mouse/desktop
AFRAME.registerComponent('tutorial-mouse-handler', {
    init: function() {
        this.el.addEventListener('click', this.onClick.bind(this));
    },

    onClick: function() {
        const raycasterComponent = this.el.components.raycaster;
        if (!raycasterComponent) return;

        const intersections = raycasterComponent.intersections;
        if (intersections && intersections.length > 0) {
            const intersection = intersections[0];
            const object = intersection.object.el;

            if (object && object.classList.contains('grab')) {
                // Simula grab/release imediato para mouse
                TutorialManager.onObjectGrabbed(object);
                
                // Simula release após pequeno delay
                setTimeout(() => {
                    TutorialManager.onObjectReleased(object);
                }, 100);
            }
        }
    }
});

// Gerenciador principal do tutorial
class TutorialManager {
    static init() {
        if (window.tutorialInitialized) {
            console.log('Tutorial already initialized');
            return;
        }
        
        console.log('Inicializando Tutorial...');
        window.tutorialInitialized = true;
        
        // Referências dos objetos
        tutorialState.startObject = document.querySelector('#start-cube');
        tutorialState.middleObject = document.querySelector('#middle-sphere');
        tutorialState.endObject = document.querySelector('#end-cylinder');

        console.log('Tutorial objects found:', {
            start: !!tutorialState.startObject,
            middle: !!tutorialState.middleObject,
            end: !!tutorialState.endObject
        });

        // Event listeners para botões
        document.getElementById('startGame')?.addEventListener('click', () => {
            SceneManager.loadScene('level-select');
        });

        document.getElementById('skipTutorial')?.addEventListener('click', () => {
            SceneManager.loadScene('level-select');
        });

        // Adiciona event listeners diretamente nos objetos
        this.setupObjectListeners();

        // Atualiza feedback inicial
        this.updateFeedback('Clique no cubo vermelho para começar!');
        this.updateStep(1);
    }

    static setupObjectListeners() {
        console.log('Setting up object listeners...');
        
        // Adiciona listeners de click nos objetos
        [tutorialState.startObject, tutorialState.middleObject, tutorialState.endObject].forEach((obj, index) => {
            if (obj) {
                console.log(`Adding listeners to object ${index}:`, obj.id);
                
                obj.addEventListener('click', (event) => {
                    console.log('Object clicked:', obj.id, event);
                    event.stopPropagation();
                    this.onObjectGrabbed(obj);
                    
                    // Simula release após delay
                    setTimeout(() => {
                        this.onObjectReleased(obj);
                    }, 100);
                });

                // Adiciona também mouseenter/mouseleave para feedback visual
                obj.addEventListener('mouseenter', () => {
                    console.log('Mouse enter:', obj.id);
                    obj.setAttribute('scale', '1.1 1.1 1.1');
                });

                obj.addEventListener('mouseleave', () => {
                    console.log('Mouse leave:', obj.id);
                    obj.setAttribute('scale', '1 1 1');
                });

                // Teste: adiciona um outline temporário
                obj.setAttribute('material', {
                    color: obj.getAttribute('color'),
                    transparent: true,
                    opacity: 0.9
                });
            } else {
                console.warn(`Object ${index} not found!`);
            }
        });
    }

    static onObjectGrabbed(object) {
        const feedback = document.querySelector('#tutorial-feedback');
        
        console.log(`Object grabbed: ${object.id}, current step: ${tutorialState.currentStep}`);
        
        switch(object.id) {
            case 'start-cube':
                if (tutorialState.currentStep === 1) {
                    this.updateFeedback('Ótimo! Agora clique na esfera azul');
                    this.updateStep(2);
                    this.highlightObject(tutorialState.middleObject);
                }
                break;
                
            case 'middle-sphere':
                if (tutorialState.currentStep === 2) {
                    this.updateFeedback('Perfeito! Agora clique no cilindro verde');
                    this.updateStep(3);
                    this.highlightObject(tutorialState.endObject);
                }
                break;
                
            case 'end-cylinder':
                if (tutorialState.currentStep === 3) {
                    this.completeTutorial();
                }
                break;
        }
    }

    static highlightObject(object) {
        if (object) {
            // Remove highlight de outros objetos
            [tutorialState.startObject, tutorialState.middleObject, tutorialState.endObject].forEach(obj => {
                if (obj && obj !== object) {
                    obj.removeAttribute('animation__tutorial-highlight');
                }
            });

            // Adiciona highlight no objeto atual
            object.setAttribute('animation__tutorial-highlight', {
                property: 'material.emissive',
                to: '#ffff00',
                dur: 500,
                dir: 'alternate',
                loop: true
            });
        }
    }

    static onObjectReleased(object) {
        // Verificar proximidade para conexões
        this.checkConnections(object);
    }

    static checkConnections(releasedObject) {
        const proximityThreshold = 2.0;
        
        // Verifica se objetos estão próximos para criar conexões
        const objects = [tutorialState.startObject, tutorialState.middleObject, tutorialState.endObject];
        
        objects.forEach(otherObject => {
            if (otherObject !== releasedObject) {
                const distance = releasedObject.object3D.position.distanceTo(otherObject.object3D.position);
                
                if (distance < proximityThreshold) {
                    this.createConnection(releasedObject, otherObject);
                }
            }
        });
    }

    static createConnection(obj1, obj2) {
        // Efeito visual de conexão
        const connectionId = `connection-${obj1.id}-${obj2.id}`;
        
        if (!document.querySelector(`#${connectionId}`)) {
            this.createVisualConnection(obj1, obj2, connectionId);
            
            // Atualiza progresso
            const connectionKey = `${obj1.id}-${obj2.id}`;
            if (!tutorialState.objectsConnected.includes(connectionKey)) {
                tutorialState.objectsConnected.push(connectionKey);
                this.updateFeedback('Conexão criada! Continue...');
            }
        }
    }

    static createVisualConnection(obj1, obj2, connectionId) {
        const connection = document.createElement('a-entity');
        connection.id = connectionId;
        
        // Linha conectando os objetos
        const line = document.createElement('a-cylinder');
        line.setAttribute('radius', 0.05);
        line.setAttribute('color', '#FFFF00');
        line.setAttribute('metalness', 0.8);
        line.setAttribute('roughness', 0.2);
        
        // Calcula posição e rotação da linha
        const pos1 = obj1.object3D.position;
        const pos2 = obj2.object3D.position;
        
        const midPoint = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5);
        const direction = new THREE.Vector3().subVectors(pos2, pos1);
        const length = direction.length();
        
        line.setAttribute('height', length);
        line.object3D.position.copy(midPoint);
        
        // Alinha com a direção
        const axis = new THREE.Vector3(0, 1, 0);
        direction.normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
        line.object3D.quaternion.copy(quaternion);
        
        connection.appendChild(line);
        document.querySelector('a-scene').appendChild(connection);
    }

    static updateStep(step) {
        tutorialState.currentStep = step;
        
        // Esconde steps anteriores
        document.querySelectorAll('[tutorial-step]').forEach(el => {
            el.setAttribute('visible', false);
        });
        
        // Mostra step atual
        document.querySelectorAll(`[tutorial-step="${step}"]`).forEach(el => {
            el.setAttribute('visible', true);
        });
    }

    static updateFeedback(message) {
        const feedback = document.querySelector('#tutorial-feedback');
        if (feedback) {
            feedback.setAttribute('value', message);
        }
    }

    static completeTutorial() {
        tutorialState.completed = true;
        this.updateFeedback('Tutorial Completo! Redirecionando...');
        
        // Celebração visual
        this.playCompletionEffect();
        
        // Redireciona após delay
        setTimeout(() => {
            SceneManager.loadScene('level-select');
        }, 3000);
    }

    static playCompletionEffect() {
        // Efeito de fogos de artifício simples
        const colors = ['#FF6B6B', '#4CC3D9', '#7BC8A4', '#FFC65D'];
        
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const particle = document.createElement('a-sphere');
                particle.setAttribute('radius', 0.1);
                particle.setAttribute('color', colors[Math.floor(Math.random() * colors.length)]);
                particle.setAttribute('position', `${(Math.random() - 0.5) * 6} 3 -4`);
                particle.setAttribute('animation', {
                    property: 'position',
                    to: `${(Math.random() - 0.5) * 10} 0 ${-2 + (Math.random() - 0.5) * 4}`,
                    dur: 2000
                });
                particle.setAttribute('animation__fade', {
                    property: 'material.opacity',
                    to: 0,
                    dur: 2000
                });
                
                document.querySelector('a-scene').appendChild(particle);
                
                // Remove após animação
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 2500);
            }, i * 200);
        }
    }
}

// Inicialização quando a cena carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Tutorial DOM loaded');
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        console.log('Scene already loaded, initializing tutorial');
        TutorialManager.init();
    } else {
        console.log('Waiting for scene to load');
        scene.addEventListener('loaded', () => {
            console.log('Scene loaded, initializing tutorial');
            TutorialManager.init();
        });
    }
});

// Debug: adiciona também um timeout como fallback
setTimeout(() => {
    if (!window.tutorialInitialized) {
        console.log('Tutorial not initialized yet, forcing initialization');
        TutorialManager.init();
        window.tutorialInitialized = true;
    }
}, 3000);

// Exporta para debug
window.TutorialManager = TutorialManager;
window.tutorialState = tutorialState;