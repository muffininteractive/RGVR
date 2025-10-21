// Movement Component - Unificado para Mouse, Touch e VR
// Gerencia movimentação de objetos em todos os dispositivos
// Consolidação de: movable-element + grab-handler

AFRAME.registerComponent('movable-element', {
    schema: {
        minDistance: { type: 'number', default: 5 },
        maxDistance: { type: 'number', default: 20 },
        wheelSpeed: { type: 'number', default: 0.01 },
        vrDistanceSpeed: { type: 'number', default: 0.1 }
    },

    init: function () {
        // === Estado de Captura ===
        this.isGrabbing = false;
        this.inputSource = 'none'; // 'mouse', 'touch', 'vr', 'none'
        this.vrController = null;  // Referência ao controle VR
        this.raycasterSource = null; // Raycaster que está apontando

        // === Estado de Movimento ===
        this.grabDistance = 1.5;
        this.initialGrabDistance = 1.5;
        this.grabOffset = new THREE.Vector3();
        this.moveOnlyXY = true;

        // === Estado de Hover ===
        this.isHovering = false;

        // === Listeners Mouse/Touch ===
        this.el.addEventListener('mousedown', this.onGrabStart.bind(this));
        this.el.addEventListener('mouseup', this.onGrabEnd.bind(this));
        this.el.addEventListener('touchstart', this.onGrabStart.bind(this), { passive: true });
        this.el.addEventListener('touchend', this.onGrabEnd.bind(this));
        this.el.addEventListener('mouseenter', this.onHoverStart.bind(this));
        this.el.addEventListener('mouseleave', this.onHoverEnd.bind(this));

        // === Listeners VR (Raycaster Intersection) ===
        // Estes eventos vêm do raycaster e indicam que o objeto foi intersectado
        this.el.addEventListener('raycaster-intersection', this.onRaycasterIntersection.bind(this));
        this.el.addEventListener('raycaster-intersection-cleared', this.onRaycasterIntersectionCleared.bind(this));

        // === Listeners Globais ===
        this._onDocMouseUp = this.onGrabEnd.bind(this);
        this._onWheel = this.onWheel.bind(this);
        window.addEventListener('mouseup', this._onDocMouseUp);
        window.addEventListener('wheel', this._onWheel, { passive: false });

        // === VR Controller Trigger Listeners ===
        // Procura pelos controllers (leftHand, rightHand) e adiciona listeners de trigger
        this.attachVRTriggerListeners();

        // === Configuração ===
        this.minDistance = this.data.minDistance;
        this.maxDistance = this.data.maxDistance;

        // === Atribui rotateAxis do atributo HTML, se existir ===
        if (this.el.hasAttribute('rotateaxis')) {
            this.rotateAxis = this.el.getAttribute('rotateaxis');
        } else {
            this.rotateAxis = null;
        }
    },

    /**
     * Conecta listeners de trigger dos controllers VR
     */
    attachVRTriggerListeners: function () {
        const sceneEl = this.el.sceneEl;
        if (!sceneEl) return;

        // Procura pelos controllers
        const leftHand = sceneEl.querySelector('#leftHand');
        const rightHand = sceneEl.querySelector('#rightHand');

        if (leftHand) {
            leftHand.addEventListener('triggerdown', (evt) => this.onVRTriggerDown(evt, leftHand));
            leftHand.addEventListener('triggerup', (evt) => this.onVRTriggerUp(evt, leftHand));
            leftHand.addEventListener('thumbstickmoved', (evt) => this.onVRThumbstickMoved(evt, leftHand));
            leftHand.addEventListener('thumbsticktouchend', (evt) => this.onVRThumbstickReleased(evt, leftHand));
        }

        if (rightHand) {
            rightHand.addEventListener('triggerdown', (evt) => this.onVRTriggerDown(evt, rightHand));
            rightHand.addEventListener('triggerup', (evt) => this.onVRTriggerUp(evt, rightHand));
            rightHand.addEventListener('thumbstickmoved', (evt) => this.onVRThumbstickMoved(evt, rightHand));
            rightHand.addEventListener('thumbsticktouchend', (evt) => this.onVRThumbstickReleased(evt, rightHand));
        }
    },

    // ============================================================
    // MÉTODOS DE RAY E ORIGEM DE ENTRADA
    // ============================================================

    /**
     * Obtém o ray de origem baseado na entrada do usuário
     * Tenta em ordem: VR controller → Mouse ray → Camera forward
     */
    getRay: function () {
        // Se está sendo capturado por VR, usa o ray do controle
        if (this.vrController) {
            return this.getVRControllerRay(this.vrController);
        }

        // Tenta ray do mouse (cursor)
        const mouseRay = this.getMouseRay();
        if (mouseRay) return mouseRay;

        // Fallback: camera forward ray
        return this.getCameraRay();
    },

    /**
     * Obtém o ray do controle VR
     */
    getVRControllerRay: function (controller) {
        const controllerPos = new THREE.Vector3();
        const controllerDir = new THREE.Vector3();

        controller.object3D.getWorldPosition(controllerPos);
        controller.object3D.getWorldDirection(controllerDir);

        // Inverte direção para que aponte para frente
        controllerDir.negate();

        return {
            origin: controllerPos.clone(),
            direction: controllerDir.clone().normalize()
        };
    },

    /**
     * Obtém o ray do cursor do mouse
     */
    getMouseRay: function () {
        const sceneEl = this.el.sceneEl;
        if (!sceneEl) return null;

        // Tenta usar raycaster do cursor
        const cursorEl = sceneEl.querySelector('[cursor]');
        const raycasterComp = cursorEl && cursorEl.components && cursorEl.components.raycaster;

        if (raycasterComp && raycasterComp.raycaster && raycasterComp.raycaster.ray) {
            const ray = raycasterComp.raycaster.ray;
            return {
                origin: ray.origin.clone(),
                direction: ray.direction.clone().normalize()
            };
        }

        return null;
    },

    /**
     * Obtém o ray forward da câmera (fallback)
     */
    getCameraRay: function () {
        const sceneEl = this.el.sceneEl;
        if (!sceneEl || !sceneEl.camera) return null;

        const camera = sceneEl.camera;
        const origin = new THREE.Vector3();
        const direction = new THREE.Vector3();

        camera.getWorldPosition(origin);
        camera.getWorldDirection(direction);

        return {
            origin: origin.clone(),
            direction: direction.clone().normalize()
        };
    },

    /**
     * Detecta a origem da entrada (mouse, touch, VR)
     */
    detectInputSource: function (evt) {
        if (evt.type === 'triggerdown') {
            this.inputSource = 'vr';
            // O VR controller é o elemento que está disparando o evento
            // Pode ser this.el se o componente estiver no controle
            // Ou pode ser obtido via raycaster
            this.vrController = this.el;
            return 'vr';
        } else if (evt.type === 'touchstart') {
            this.inputSource = 'touch';
            return 'touch';
        } else if (evt.type === 'mousedown') {
            this.inputSource = 'mouse';
            return 'mouse';
        }
        return 'none';
    },

    // ============================================================
    // MÉTODOS VR - TRIGGER E THUMBSTICK
    // ============================================================

    /**
     * Trigger do controle VR pressionado (evento do controller)
     */
    onVRTriggerDown: function (evt, controller) {
        // Verifica se este objeto está sendo intersectado pelo raycaster deste controller
        if (!this.isHovering) return;

        // Se hovering, inicia grab
        this.inputSource = 'vr';
        this.vrController = controller;

        const ray = this.getRay();
        if (!ray) return;

        const objPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(objPos);

        this.grabDistance = ray.origin.distanceTo(objPos);
        this.initialGrabDistance = this.grabDistance;

        const rayPoint = ray.origin.clone().add(ray.direction.clone().multiplyScalar(this.grabDistance));
        this.grabOffset.copy(objPos).sub(rayPoint);

        this.grabDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.grabDistance));

        this.moveOnlyXY = true;

        this.hideHoverFeedback();
        if (this.rotateAxis) {
            this.showGrabFeedback();
        }


        this.el.removeAttribute('animation');
        this.el.removeAttribute('animation__position');
        this.el.removeAttribute('animation__rotation');

        this.isGrabbing = true;

        console.log(`🎯 VR: Objeto capturado. Distância: ${this.grabDistance.toFixed(2)}`);
    },

    /**
     * Trigger do controle VR liberado (evento do controller)
     */
    onVRTriggerUp: function (evt, controller) {
        if (!this.isGrabbing || this.vrController !== controller) return;

        this.isGrabbing = false;
        this.vrController = null;
        this.inputSource = 'none';
        this.moveOnlyXY = true;

        this.hideGrabFeedback();

        this.el.setAttribute('animation', `property: scale; to: 1 1 1; dur: 200; easing: easeOutQuad`);

        console.log('🔓 VR: Objeto liberado');
    },

    /**
     * Thumbstick do controle VR movido (evento do controller)
     */
    onVRThumbstickMoved: function (evt, controller) {
        if (!this.isGrabbing || this.vrController !== controller) return;

        // Gira o objeto no eixo definido por rotateAxis, se existir
        const { x } = evt.detail;
        if (Math.abs(x) > 0.05 && this.rotateAxis) {
            const rotationSpeed = 2.0 * (Math.PI / 180); // radianos por tick
            if (this.rotateAxis === 'x') {
                this.el.object3D.rotation.x -= x * rotationSpeed;
            } else if (this.rotateAxis === 'y') {
                this.el.object3D.rotation.y -= x * rotationSpeed;
            } else {
                this.el.object3D.rotation.z -= x * rotationSpeed;
            }
        }
        /*
                const { y } = evt.detail;
        
                if (Math.abs(y) > 0.1) {
                    this.moveOnlyXY = false;
        
                    // Y positivo = para trás (mais perto)
                    // Y negativo = para frente (mais longe)
                    this.grabDistance -= y * this.data.vrDistanceSpeed;
        
                    this.grabDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.grabDistance));
                }
        */
        evt.stopPropagation();
    },

    /**
     * Thumbstick liberado (evento do controller)
     */
    onVRThumbstickReleased: function (evt, controller) {
        if (this.isGrabbing && this.vrController === controller) {
            this.moveOnlyXY = true;
        }
    },

    // ============================================================
    // MÉTODOS DE GRAB (CAPTURA/LIBERAÇÃO)
    // ============================================================

    /**
     * Inicia a captura do objeto (grabStart)
     */
    onGrabStart: function (evt) {
        // Evita captura dupla
        if (this.isGrabbing) return;

        // Detecta origem
        const source = this.detectInputSource(evt);

        // Validações específicas de mouse
        if (evt && evt.type === 'mousedown' && evt.detail?.mouseEvent?.button !== 0) {
            return;
        }

        // Obtém o ray
        const ray = this.getRay();
        if (!ray) return;

        // Obtém posição do objeto
        const objPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(objPos);

        // Calcula distância
        this.grabDistance = ray.origin.distanceTo(objPos);
        this.initialGrabDistance = this.grabDistance;

        // Calcula offset
        const rayPoint = ray.origin.clone().add(ray.direction.clone().multiplyScalar(this.grabDistance));
        this.grabOffset.copy(objPos).sub(rayPoint);

        // Aplica limites
        this.grabDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.grabDistance));

        // Reset state
        this.moveOnlyXY = true;

        // Feedback visual
        this.hideHoverFeedback();
        if (this.rotateAxis) {
            this.showGrabFeedback();
        }

        // Remove animações pré-existentes (principalmente VR)
        this.el.removeAttribute('animation');
        this.el.removeAttribute('animation__position');
        this.el.removeAttribute('animation__rotation');

        this.isGrabbing = true;

        console.log(`🎯 Objeto capturado via ${source}. Distância: ${this.grabDistance.toFixed(2)}`);
    },

    /**
     * Libera o objeto (grabEnd)
     */
    onGrabEnd: function (evt) {
        if (!this.isGrabbing) return;

        this.isGrabbing = false;
        this.vrController = null;
        this.inputSource = 'none';
        this.moveOnlyXY = true;

        // Remove feedback visual
        this.hideGrabFeedback();

        // Reset de scale
        this.el.setAttribute('animation', `property: scale; to: 1 1 1; dur: 200; easing: easeOutQuad`);

        console.log('🔓 Objeto liberado');
    },

    // ============================================================
    // MÉTODOS DE HOVER
    // ============================================================

    /**
     * Inicia hover do objeto
     */
    onHoverStart: function (evt) {
        if (this.isGrabbing || this.isHovering) return;

        this.isHovering = true;
        this.showHoverFeedback();

        console.log('👁️ Objeto em hover');
    },

    /**
     * Finaliza hover do objeto
     */
    onHoverEnd: function (evt) {
        if (this.isGrabbing) return;

        this.isHovering = false;
        this.hideHoverFeedback();

        console.log('👁️ Hover finalizado');
    },

    /**
     * Raycaster intersecção (VR hover)
     */
    onRaycasterIntersection: function (evt) {
        // Quando o raycaster intersecta com este objeto
        if (this.isGrabbing || this.isHovering) return;

        this.isHovering = true;
        this.showHoverFeedback();

        console.log('👁️ VR Raycaster: objeto em hover');
    },

    /**
     * Raycaster intersecção limpa (VR hover end)
     */
    onRaycasterIntersectionCleared: function (evt) {
        if (this.isGrabbing) return;

        this.isHovering = false;
        this.hideHoverFeedback();

        console.log('👁️ VR Raycaster: hover finalizado');
    },

    // ============================================================
    // CONTROLE DE DISTÂNCIA (Profundidade Z)
    // ============================================================

    /**
     * Roda do mouse para controlar profundidade
     */
    onWheel: function (evt) {
        if (!this.isGrabbing) return;

        // Rotaciona conforme rotateAxis
        if (this.rotateAxis) {
            const rotationSpeed = 0.001 * 0.5; // radianos por tick
            if (this.rotateAxis === 'x') {
                this.el.object3D.rotation.x += evt.deltaY * rotationSpeed;
            } else if (this.rotateAxis === 'y') {
                this.el.object3D.rotation.y += evt.deltaY * rotationSpeed;
            } else {
                this.el.object3D.rotation.z += evt.deltaY * rotationSpeed;
            }
        }
        evt.preventDefault();

        // Timer para voltar ao modo XY
        if (this._wheelTimeout) clearTimeout(this._wheelTimeout);
        this._wheelTimeout = setTimeout(() => {
            this.moveOnlyXY = true;
        }, 200);
    },

    // ============================================================
    // FEEDBACK VISUAL
    // ============================================================


    showGrabFeedback: function () {
        this.createRollFeedback();
        this.el.setAttribute('animation', 'property: scale; to: 1.1 1.1 1.1; dur: 200; easing: easeOutQuad');
    },


    showHoverFeedback: function () {
        this.createGrabFeedback();
        this.el.setAttribute('animation', 'property: scale; to: 1.1 1.1 1.1; dur: 200; easing: easeOutQuad');
    },

    /**
     * Esconde feedback ao liberar
     */
    hideGrabFeedback: function () {
        this.removeRollFeedback();
        this.el.setAttribute('animation', 'property: scale; to: 1 1 1; dur: 200; easing: easeOutQuad');
    },

    /**
     * Esconde feedback ao finalizar hover
     */
    hideHoverFeedback: function () {
        this.removeGrabFeedback();
        this.el.setAttribute('animation', 'property: scale; to: 1 1 1; dur: 200; easing: easeOutQuad');
    },


    createGrabFeedback: function () {
        // Remove se existir
        this.removeGrabFeedback();

        // Evita duplicidade: só cria se não existir
        if (this.el.querySelector('.grab-img')) return;

        const plane = document.createElement('a-image');
        plane.setAttribute('width', '1');
        plane.setAttribute('height', '1');
        plane.setAttribute('rotation', '0 0 0');
        plane.setAttribute('position', '0 1.5 0.5');
        plane.classList.add('grab-img');

        // Adiciona textura (sprite.png)
        plane.setAttribute('src', '#grabTex');
        //plane.setAttribute('transparent', 'true');
        //plane.setAttribute('material', 'side: double; transparent: true; alphaTest: 0.01;');

        //plane.setAttribute('shadow', 'cast: false; receive: false');
        // Torna o plano não interativo para não bloquear eventos
        plane.setAttribute('pointer-events', 'none');
        plane.style.pointerEvents = 'none';

        // Cria asset se não existir
        const sceneEl = this.el.sceneEl;

        this.el.appendChild(plane);
    },
    removeGrabFeedback: function () {
        const plane = this.el.querySelector('.grab-img');
        if (plane && plane.parentNode === this.el) {
            this.el.removeChild(plane);
        }
    },

    createRollFeedback: function () {
        // Remove se existir
        this.removeRollFeedback();

        // Evita duplicidade: só cria se não existir
        if (this.el.querySelector('.roll-img')) return;

        const plane = document.createElement('a-image');
        plane.setAttribute('width', '1');
        plane.setAttribute('height', '1');
        plane.setAttribute('rotation', '0 0 0');
        plane.setAttribute('position', '0 1.5 0.5');
        plane.classList.add('grab-img');

        // Adiciona textura (sprite.png)
        if (this.inputSource === 'vr') {
            plane.setAttribute('src', '#rollTex');
        } else {
            plane.setAttribute('src', '#scrollTex');
        }

        //plane.setAttribute('transparent', 'true');
        //plane.setAttribute('material', 'side: double; transparent: true; alphaTest: 0.01;');

        //plane.setAttribute('shadow', 'cast: false; receive: false');
        // Torna o plano não interativo para não bloquear eventos
        plane.setAttribute('pointer-events', 'none');
        plane.style.pointerEvents = 'none';

        // Cria asset se não existir
        const sceneEl = this.el.sceneEl;

        this.el.appendChild(plane);
    },
    removeRollFeedback: function () {
        const plane = this.el.querySelector('.roll-img');
        if (plane && plane.parentNode === this.el) {
            this.el.removeChild(plane);
        }
    },

    // ============================================================
    // ATUALIZAÇÃO DE POSIÇÃO (TICK)
    // ============================================================

    /**
     * Atualiza a posição do objeto a cada frame
     */
    tick: function () {
        if (!this.isGrabbing) return;

        const ray = this.getRay();
        if (!ray) return;

        // Calcula posição alvo
        const targetPos = ray.origin.clone().add(ray.direction.clone().multiplyScalar(this.grabDistance));

        // Escala o offset proporcionalmente
        const distanceRatio = this.initialGrabDistance > 0 ? (this.grabDistance / this.initialGrabDistance) : 1;
        const scaledOffset = this.grabOffset.clone().multiplyScalar(distanceRatio);
        targetPos.add(scaledOffset);

        // Aplica limites (custom via dataset ou defaults)
        this.applyBounds(targetPos);

        // Atualiza posição
        if (this.moveOnlyXY) {
            this.el.object3D.position.set(targetPos.x, targetPos.y, this.el.object3D.position.z);
        } else {
            this.el.object3D.position.copy(targetPos);
        }
    },

    /**
     * Aplica os limites de movimento (minY, maxY, minX, maxX)
     */
    applyBounds: function (targetPos) {
        let minY = 0, maxY = Infinity, minX = -Infinity, maxX = Infinity;

        // Obtém valores customizados ou calcula altura automática
        if (this.el.dataset.minY !== undefined) {
            minY = parseFloat(this.el.dataset.minY);
        } else {
            const geometry = this.el.object3D.children[0]?.geometry;
            let objectHeight = 0;
            if (geometry) {
                geometry.computeBoundingBox();
                const bbox = geometry.boundingBox;
                if (bbox) {
                    objectHeight = (bbox.max.y - bbox.min.y) * this.el.object3D.scale.y / 2;
                }
            }
            minY = objectHeight;
        }

        if (this.el.dataset.maxY !== undefined) maxY = parseFloat(this.el.dataset.maxY);
        if (this.el.dataset.minX !== undefined) minX = parseFloat(this.el.dataset.minX);
        if (this.el.dataset.maxX !== undefined) maxX = parseFloat(this.el.dataset.maxX);

        // Clamp dos valores
        if (targetPos.y < minY) targetPos.y = minY;
        if (targetPos.y > maxY) targetPos.y = maxY;
        if (targetPos.x < minX) targetPos.x = minX;
        if (targetPos.x > maxX) targetPos.x = maxX;
    },

    // ============================================================
    // CLEANUP
    // ============================================================

    remove: function () {
        if (this._onDocMouseUp) window.removeEventListener('mouseup', this._onDocMouseUp);
        if (this._onWheel) window.removeEventListener('wheel', this._onWheel);
        if (this._wheelTimeout) clearTimeout(this._wheelTimeout);

        // Remove listeners VR dos controllers
        const sceneEl = this.el.sceneEl;
        if (sceneEl) {
            const leftHand = sceneEl.querySelector('#leftHand');
            const rightHand = sceneEl.querySelector('#rightHand');

            if (leftHand) {
                leftHand.removeEventListener('triggerdown', this.onVRTriggerDown);
                leftHand.removeEventListener('triggerup', this.onVRTriggerUp);
                leftHand.removeEventListener('thumbstickmoved', this.onVRThumbstickMoved);
                leftHand.removeEventListener('thumbsticktouchend', this.onVRThumbstickReleased);
            }

            if (rightHand) {
                rightHand.removeEventListener('triggerdown', this.onVRTriggerDown);
                rightHand.removeEventListener('triggerup', this.onVRTriggerUp);
                rightHand.removeEventListener('thumbstickmoved', this.onVRThumbstickMoved);
                rightHand.removeEventListener('thumbsticktouchend', this.onVRThumbstickReleased);
            }
        }
    }
});
