// Lever Component - RGVR
// Componente para alavanca interativa com modelo GLB e física Cannon.js

AFRAME.registerComponent('lever', {
    schema: {
        objectId: { type: 'string', default: '' },
        modelPath: { type: 'string', default: '/assets/models/lever.glb' },
        onAngle: { type: 'number', default: -45 },  // Ângulo ligado (em graus)
        offAngle: { type: 'number', default: 45 },  // Ângulo desligado (em graus)
        initialState: { type: 'boolean', default: false }, // true = ligado, false = desligado
        rotationAxis: { type: 'string', default: 'z' }, // Eixo de rotação (x, y ou z)
        interactionDistance: { type: 'number', default: 10 }, // Distância para interagir (aumentada)
        animationDuration: { type: 'number', default: 500 }, // Duração da animação em ms
        debug: { type: 'boolean', default: false }, // Modo debug para visualizar colisão
        // Propriedades físicas
        usePhysics: { type: 'boolean', default: true }, // Usar física Cannon.js
        leverMass: { type: 'number', default: 1 }, // Massa da alavanca
        friction: { type: 'number', default: 0.5 }, // Fricção
        damping: { type: 'number', default: 0.8 }, // Amortecimento rotacional
        forceMultiplier: { type: 'number', default: 2 } // Multiplicador de força ao ativar
    },

    init: function () {
        this.leverObject = null;
        this.leverPhysicsBody = null; // Body físico da alavanca
        this.hingeConstraint = null; // Constraint de dobradiça
        this.collisionBox = null;
        this.redIndicator = null;
        this.greenIndicator = null;
        this.isOn = this.data.initialState;
        this.isAnimating = false;
        this.camera = null;

        // Callbacks para estados
        this.onActivateCallback = null;
        this.onDeactivateCallback = null;

        // Bind methods
        this.onClick = this.onClick.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onCollide = this.onCollide.bind(this);

        // Carrega o modelo
        this.loadModel();

        console.log(`Lever initialized: ${this.data.objectId}`, {
            onAngle: this.data.onAngle,
            offAngle: this.data.offAngle,
            initialState: this.isOn ? 'ON' : 'OFF',
            usePhysics: this.data.usePhysics
        });
    },

    loadModel: function () {
        // Adiciona o modelo GLB ao elemento
        this.el.setAttribute('gltf-model', this.data.modelPath);

        // Se usar física, adiciona static-body à base da alavanca
        if (this.data.usePhysics) {
            // A base da alavanca é estática
            this.el.setAttribute('static-body', {
                shape: 'box',
                width: 0.5,
                height: 0.2,
                depth: 0.5
            });
        }

        // Aguarda o modelo carregar
        this.el.addEventListener('model-loaded', () => {
            console.log('Lever model loaded');

            // Encontra o objeto "Alavanca" dentro do modelo
            const model = this.el.getObject3D('mesh');
            if (model) {
                this.leverObject = this.findLeverObject(model);

                if (this.leverObject) {
                    console.log('Lever object found:', this.leverObject.name);

                    // Configura física se habilitado
                    if (this.data.usePhysics) {
                        this.setupPhysics();
                    }

                    // Define rotação inicial baseado no estado
                    this.setLeverRotation(this.isOn ? this.data.onAngle : this.data.offAngle, false);
                } else {
                    console.warn('Lever object "Alavanca" not found in model');
                }

                // Adiciona geometria de colisão invisível DEPOIS do modelo carregar
                this.addCollisionGeometry();

                // Adiciona uma animação sutil para indicar interatividade
                this.el.setAttribute('animation__pulse', {
                    property: 'position',
                    to: `${this.el.getAttribute('position').x} ${this.el.getAttribute('position').y + 0.05} ${this.el.getAttribute('position').z}`,
                    dur: 2000,
                    dir: 'alternate',
                    loop: true,
                    easing: 'easeInOutQuad'
                });
            }
        });
    },

    setupPhysics: function () {
        // Cria um corpo físico para a parte móvel da alavanca
        const leverBody = document.createElement('a-entity');
        leverBody.setAttribute('position', '0 0.7 0'); // Posição relativa da parte móvel
        leverBody.setAttribute('dynamic-body', {
            mass: this.data.leverMass,
            angularDamping: this.data.damping,
            linearDamping: 0.9,
            shape: 'box',
            width: 0.2,
            height: 0.8,
            depth: 0.2
        });

        // Visual debug se necessário
        if (this.data.debug) {
            leverBody.setAttribute('geometry', {
                primitive: 'box',
                width: 0.2,
                height: 0.8,
                depth: 0.2
            });
            leverBody.setAttribute('material', {
                color: '#ff00ff',
                opacity: 0.3,
                transparent: true
            });
        } else {
            leverBody.setAttribute('visible', false);
        }

        this.el.appendChild(leverBody);
        this.leverPhysicsBody = leverBody;

        // Aguarda o physics system carregar e então cria o constraint
        leverBody.addEventListener('body-loaded', () => {
            this.createHingeConstraint();
        });

        console.log('Physics body created for lever');
    },

    createHingeConstraint: function () {
        // Cria um constraint de dobradiça (hinge) que limita a rotação
        const physicsSystem = this.el.sceneEl.systems.physics;

        if (!physicsSystem || !physicsSystem.driver) {
            console.warn('Physics system not ready yet');
            setTimeout(() => this.createHingeConstraint(), 100);
            return;
        }

        const CANNON = physicsSystem.driver.CANNON;
        if (!CANNON) {
            console.error('CANNON not available');
            return;
        }

        const leverBody = this.leverPhysicsBody.body;
        const baseBody = this.el.body;

        if (!leverBody || !baseBody) {
            console.warn('Bodies not ready for constraint');
            setTimeout(() => this.createHingeConstraint(), 100);
            return;
        }

        // Ponto de pivô (dobradiça) - na base da alavanca
        const pivotA = new CANNON.Vec3(0, 0.5, 0); // Na parte superior da base
        const pivotB = new CANNON.Vec3(0, -0.4, 0); // Na parte inferior do braço

        // Eixo de rotação baseado no schema
        let axisA, axisB;
        switch (this.data.rotationAxis) {
            case 'x':
                axisA = new CANNON.Vec3(1, 0, 0);
                axisB = new CANNON.Vec3(1, 0, 0);
                break;
            case 'y':
                axisA = new CANNON.Vec3(0, 1, 0);
                axisB = new CANNON.Vec3(0, 1, 0);
                break;
            case 'z':
            default:
                axisA = new CANNON.Vec3(0, 0, 1);
                axisB = new CANNON.Vec3(0, 0, 1);
                break;
        }

        // Cria o HingeConstraint
        this.hingeConstraint = new CANNON.HingeConstraint(baseBody, leverBody, {
            pivotA: pivotA,
            axisA: axisA,
            pivotB: pivotB,
            axisB: axisB,
            maxForce: 10
        });

        // Adiciona o constraint ao mundo físico
        physicsSystem.driver.world.addConstraint(this.hingeConstraint);

        // Habilita limites de ângulo
        const minAngle = THREE.MathUtils.degToRad(Math.min(this.data.onAngle, this.data.offAngle));
        const maxAngle = THREE.MathUtils.degToRad(Math.max(this.data.onAngle, this.data.offAngle));

        this.hingeConstraint.enableMotor();
        this.hingeConstraint.setMotorSpeed(0);
        this.hingeConstraint.setMotorMaxForce(5);

        console.log('Hinge constraint created', {
            minAngle: minAngle,
            maxAngle: maxAngle,
            axis: this.data.rotationAxis
        });
    },

    addCollisionGeometry: function () {
        // Cria um elemento filho para a colisão
        const collisionBox = document.createElement('a-entity');
        collisionBox.setAttribute('geometry', {
            primitive: 'box',
            width: 0.8,
            height: 1.5,
            depth: 0.5
        });
        collisionBox.setAttribute('material', {
            opacity: this.data.debug ? 0.3 : 0,
            transparent: true,
            color: '#00ff00'
        });
        collisionBox.setAttribute('position', '0 0.5 0'); // Ajusta posição para cobrir a alavanca
        collisionBox.classList.add('interactive');
        collisionBox.classList.add('clickable');

        // Adiciona sensor físico se usar física (não afeta objetos dinamicamente)
        if (this.data.usePhysics) {
            // Sensor para detectar colisões sem afetar a física
            collisionBox.addEventListener('collide', this.onCollide);
        }

        // Adiciona como filho do elemento principal
        this.el.appendChild(collisionBox);
        this.collisionBox = collisionBox;

        // Propaga eventos de click do filho para o pai
        collisionBox.addEventListener('click', (evt) => {
            evt.stopPropagation();
            this.onClick(evt);
        });
        collisionBox.addEventListener('mouseenter', (evt) => {
            evt.stopPropagation();
            this.onMouseEnter(evt);
        });
        collisionBox.addEventListener('mouseleave', (evt) => {
            evt.stopPropagation();
            this.onMouseLeave(evt);
        });

        console.log('Collision geometry added to lever');

        // Adiciona as esferas indicadoras de estado
        this.addStatusIndicators();
    },

    onCollide: function (evt) {
        // Detecta colisão com objetos físicos (ex: bola rolando)
        const otherEl = evt.detail.body.el;

        console.log('Lever collision detected with:', otherEl?.id || 'unknown');

        // Emite evento de colisão para o game manager processar
        this.el.emit('lever-collision', {
            lever: this.el,
            otherObject: otherEl,
            objectId: this.data.objectId
        });

        // Poderia auto-ativar a alavanca se atingida com força suficiente
        // const impulse = evt.detail.contact.getImpactVelocityAlongNormal();
        // if (Math.abs(impulse) > 2) {
        //     this.toggle();
        // }
    },

    addStatusIndicators: function () {
        // Esfera VERMELHA (OFF) - à esquerda
        const redSphere = document.createElement('a-entity');
        redSphere.setAttribute('geometry', {
            primitive: 'sphere',
            radius: 0.15
        });
        redSphere.setAttribute('material', {
            color: '#ff0000',
            emissive: '#ff0000',
            emissiveIntensity: this.isOn ? 0 : 1, // Acesa quando desligado
            metalness: 0.3,
            roughness: 0.2
        });
        redSphere.setAttribute('position', '-0.3 0.1 0'); // À esquerda na base

        // Luz vermelha
        const redLight = document.createElement('a-entity');
        redLight.setAttribute('light', {
            type: 'point',
            color: '#ff0000',
            intensity: this.isOn ? 0 : 0.8,
            distance: 2,
            decay: 2
        });
        redLight.setAttribute('position', '0 0 0');
        redSphere.appendChild(redLight);

        // Esfera VERDE (ON) - à direita
        const greenSphere = document.createElement('a-entity');
        greenSphere.setAttribute('geometry', {
            primitive: 'sphere',
            radius: 0.15
        });
        greenSphere.setAttribute('material', {
            color: '#00ff00',
            emissive: '#00ff00',
            emissiveIntensity: this.isOn ? 1 : 0, // Acesa quando ligado
            metalness: 0.3,
            roughness: 0.2
        });
        greenSphere.setAttribute('position', '0.3 0.1 0'); // À direita na base

        // Luz verde
        const greenLight = document.createElement('a-entity');
        greenLight.setAttribute('light', {
            type: 'point',
            color: '#00ff00',
            intensity: this.isOn ? 0.8 : 0,
            distance: 2,
            decay: 2
        });
        greenLight.setAttribute('position', '0 0 0');
        greenSphere.appendChild(greenLight);

        // Adiciona ao elemento principal
        this.el.appendChild(redSphere);
        this.el.appendChild(greenSphere);

        // Armazena referências para poder atualizar depois
        this.redIndicator = {
            sphere: redSphere,
            light: redLight
        };
        this.greenIndicator = {
            sphere: greenSphere,
            light: greenLight
        };

        console.log('Status indicators added to lever');
    },

    updateStatusIndicators: function () {
        if (!this.redIndicator || !this.greenIndicator) return;

        // Animação suave para as transições
        const duration = 300;

        // Atualiza ESFERA VERMELHA (OFF)
        // Quando isOn = false, a vermelha ACENDE
        // Quando isOn = true, a vermelha APAGA
        this.redIndicator.sphere.setAttribute('animation__emission', {
            property: 'material.emissiveIntensity',
            to: this.isOn ? 0 : 1,
            dur: duration,
            easing: 'easeInOutQuad'
        });
        this.redIndicator.light.setAttribute('animation__intensity', {
            property: 'light.intensity',
            to: this.isOn ? 0 : 0.8,
            dur: duration,
            easing: 'easeInOutQuad'
        });

        // Atualiza ESFERA VERDE (ON)
        // Quando isOn = true, a verde ACENDE
        // Quando isOn = false, a verde APAGA
        this.greenIndicator.sphere.setAttribute('animation__emission', {
            property: 'material.emissiveIntensity',
            to: this.isOn ? 1 : 0,
            dur: duration,
            easing: 'easeInOutQuad'
        });
        this.greenIndicator.light.setAttribute('animation__intensity', {
            property: 'light.intensity',
            to: this.isOn ? 0.8 : 0,
            dur: duration,
            easing: 'easeInOutQuad'
        });

        console.log('Status indicators updated:', {
            isOn: this.isOn,
            red: this.isOn ? 'OFF' : 'ON',
            green: this.isOn ? 'ON' : 'OFF'
        });
    },

    findLeverObject: function (object) {
        // Procura recursivamente pelo objeto chamado "Alavanca"
        if (object.name && object.name.toLowerCase().includes('alavanca')) {
            return object;
        }

        if (object.children) {
            for (let child of object.children) {
                const found = this.findLeverObject(child);
                if (found) return found;
            }
        }

        return null;
    },

    onClick: function (evt) {
        console.log('Lever clicked!', {
            objectId: this.data.objectId,
            isAnimating: this.isAnimating,
            currentState: this.isOn ? 'ON' : 'OFF'
        });

        if (this.isAnimating) {
            console.log('Lever is animating, ignoring click');
            return;
        }

        // Verifica distância do jogador
        if (!this.isInRange()) {
            console.log('Too far to interact with lever');
            return;
        }

        // Alterna o estado
        this.toggle();
    },

    onMouseEnter: function () {
        if (!this.isInRange()) return;

        console.log('Mouse entered lever');

        // Visual feedback - aumenta a escala do modelo principal
        this.el.setAttribute('animation__hover', {
            property: 'scale',
            to: '1.15 1.15 1.15',
            dur: 200,
            easing: 'easeOutQuad'
        });

        // Se tiver debug ativo, mostra a collision box
        if (this.data.debug && this.collisionBox) {
            this.collisionBox.setAttribute('material', 'opacity', 0.3);
        }
    },

    onMouseLeave: function () {
        console.log('Mouse left lever');

        // Remove o aumento de escala
        this.el.setAttribute('animation__hover', {
            property: 'scale',
            to: '1 1 1',
            dur: 200,
            easing: 'easeOutQuad'
        });

        // Esconde a collision box novamente
        if (this.data.debug && this.collisionBox) {
            this.collisionBox.setAttribute('material', 'opacity', 0.3);
        } else if (this.collisionBox) {
            this.collisionBox.setAttribute('material', 'opacity', 0);
        }
    },

    toggle: function () {
        if (this.isAnimating) return;

        this.isOn = !this.isOn;
        const targetAngle = this.isOn ? this.data.onAngle : this.data.offAngle;

        console.log(`Lever toggled: ${this.isOn ? 'ON' : 'OFF'} (angle: ${targetAngle}°)`);

        // Se usar física, aplica torque; senão anima diretamente
        if (this.data.usePhysics && this.hingeConstraint) {
            this.applyPhysicsToggle(targetAngle);
        } else if (this.leverObject) {
            this.setLeverRotation(targetAngle, true);
        }

        // Atualiza os indicadores de estado
        this.updateStatusIndicators();

        // Executa callback apropriado
        if (this.isOn && this.onActivateCallback) {
            this.onActivateCallback();
        } else if (!this.isOn && this.onDeactivateCallback) {
            this.onDeactivateCallback();
        }

        // Emite evento customizado
        this.el.emit('lever-changed', {
            isOn: this.isOn,
            angle: targetAngle,
            objectId: this.data.objectId
        });
    },

    applyPhysicsToggle: function (targetAngle) {
        // Aplica um torque para mover a alavanca fisicamente
        if (!this.leverPhysicsBody || !this.leverPhysicsBody.body) {
            console.warn('Physics body not ready');
            return;
        }

        const body = this.leverPhysicsBody.body;
        const targetRad = THREE.MathUtils.degToRad(targetAngle);

        // Define velocidade do motor da dobradiça
        const motorSpeed = this.isOn ? 3 : -3; // Velocidade positiva ou negativa
        this.hingeConstraint.setMotorSpeed(motorSpeed);
        this.hingeConstraint.setMotorMaxForce(this.data.forceMultiplier * 10);

        // Para o motor após um tempo
        setTimeout(() => {
            if (this.hingeConstraint) {
                this.hingeConstraint.setMotorSpeed(0);
            }
        }, this.data.animationDuration);

        console.log('Applied physics toggle', {
            motorSpeed,
            targetAngle,
            force: this.data.forceMultiplier * 10
        });
    },

    setLeverRotation: function (angle, animate = false) {
        if (!this.leverObject) return;

        const targetRotation = this.getRotationForAxis(angle);

        if (animate) {
            this.isAnimating = true;
            this.animateRotation(this.leverObject.rotation, targetRotation);
        } else {
            // Define rotação diretamente
            this.leverObject.rotation[this.data.rotationAxis] = THREE.MathUtils.degToRad(angle);
        }
    },

    getRotationForAxis: function (angle) {
        const rotation = { x: 0, y: 0, z: 0 };
        rotation[this.data.rotationAxis] = THREE.MathUtils.degToRad(angle);
        return rotation;
    },

    animateRotation: function (currentRotation, targetRotation) {
        const startRotation = { ...currentRotation };
        const startTime = Date.now();
        const duration = this.data.animationDuration;
        const axis = this.data.rotationAxis;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing (ease-in-out)
            const eased = progress < 0.5
                ? 2 * progress * progress
                : -1 + (4 - 2 * progress) * progress;

            // Interpola a rotação
            currentRotation[axis] = startRotation[axis] +
                (targetRotation[axis] - startRotation[axis]) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
            }
        };

        animate();
    },

    isInRange: function () {
        if (!this.camera) {
            this.camera = document.querySelector('[camera]');
        }

        if (!this.camera) {
            console.warn('Camera not found, allowing interaction');
            return true; // Se não tem câmera, permite interação
        }

        const cameraPos = this.camera.object3D.getWorldPosition(new THREE.Vector3());
        const leverPos = this.el.object3D.getWorldPosition(new THREE.Vector3());
        const distance = cameraPos.distanceTo(leverPos);

        console.log('Distance check:', {
            distance: distance.toFixed(2),
            maxDistance: this.data.interactionDistance,
            inRange: distance <= this.data.interactionDistance
        });

        return distance <= this.data.interactionDistance;
    },

    // API Pública
    turnOn: function () {
        if (!this.isOn) {
            this.toggle();
        }
    },

    turnOff: function () {
        if (this.isOn) {
            this.toggle();
        }
    },

    setState: function (state) {
        if (state !== this.isOn) {
            this.toggle();
        }
    },

    getState: function () {
        return this.isOn;
    },

    // Registra callbacks para mudanças de estado
    onActivate: function (callback) {
        this.onActivateCallback = callback;
    },

    onDeactivate: function (callback) {
        this.onDeactivateCallback = callback;
    },

    remove: function () {
        // Remove constraint físico
        if (this.hingeConstraint) {
            const physicsSystem = this.el.sceneEl.systems.physics;
            if (physicsSystem && physicsSystem.driver && physicsSystem.driver.world) {
                physicsSystem.driver.world.removeConstraint(this.hingeConstraint);
            }
            this.hingeConstraint = null;
        }

        // Cleanup dos event listeners
        if (this.collisionBox) {
            this.collisionBox.removeEventListener('click', this.onClick);
            this.collisionBox.removeEventListener('mouseenter', this.onMouseEnter);
            this.collisionBox.removeEventListener('mouseleave', this.onMouseLeave);
            this.collisionBox.removeEventListener('collide', this.onCollide);

            // Remove o elemento de colisão
            if (this.collisionBox.parentNode) {
                this.collisionBox.parentNode.removeChild(this.collisionBox);
            }
        }

        // Remove o corpo físico
        if (this.leverPhysicsBody && this.leverPhysicsBody.parentNode) {
            this.leverPhysicsBody.parentNode.removeChild(this.leverPhysicsBody);
        }

        // Remove os indicadores de estado
        if (this.redIndicator && this.redIndicator.sphere.parentNode) {
            this.redIndicator.sphere.parentNode.removeChild(this.redIndicator.sphere);
        }
        if (this.greenIndicator && this.greenIndicator.sphere.parentNode) {
            this.greenIndicator.sphere.parentNode.removeChild(this.greenIndicator.sphere);
        }

        console.log('Lever component removed and cleaned up');
    }
});
