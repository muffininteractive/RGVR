// Level UI Components - Interface and controls for levels
// Manages Play/Restart buttons, goal, celebration and navigation

// Component: Play Button
AFRAME.registerComponent('level-play-button', {
    schema: {
        position: { type: 'vec3', default: { x: -2, y: 1.6, z: -3 } }
    },

    init: function () {
        // Create button container
        this.createButton();

        // Event listeners
        this.el.addEventListener('click', this.onPlay.bind(this));
        this.el.addEventListener('mouseenter', this.onHover.bind(this));
        this.el.addEventListener('mouseleave', this.onUnhover.bind(this));
    },

    createButton: function () {
        // Button background
        const bg = document.createElement('a-box');
        bg.setAttribute('width', 2);
        bg.setAttribute('height', 0.6);
        bg.setAttribute('depth', 0.1);
        bg.setAttribute('color', '#00ff00');
        bg.setAttribute('material', 'shader: flat');
        bg.classList.add('interactive');

        // Button text
        const text = document.createElement('a-text');
        text.setAttribute('value', 'PLAY ▶');
        text.setAttribute('align', 'center');
        text.setAttribute('color', '#000000');
        text.setAttribute('width', 4);
        text.setAttribute('position', '0 0 0.06');
        text.setAttribute('font', 'roboto');

        this.el.appendChild(bg);
        this.el.appendChild(text);

        this.bg = bg;
        this.text = text;
    },

    onHover: function () {
        this.bg.setAttribute('color', '#00cc00');
        this.bg.setAttribute('animation', {
            property: 'scale',
            to: '1.1 1.1 1.1',
            dur: 200
        });
    },

    onUnhover: function () {
        this.bg.setAttribute('color', '#00ff00');
        this.bg.setAttribute('animation', {
            property: 'scale',
            to: '1 1 1',
            dur: 200
        });
    },

    onPlay: function () {
        console.log('▶️ Botão Play pressionado');

        // Click animation
        this.bg.setAttribute('animation', {
            property: 'scale',
            to: '0.95 0.95 0.95',
            dur: 100
        });

        setTimeout(() => {
            this.bg.setAttribute('animation', {
                property: 'scale',
                to: '1 1 1',
                dur: 100
            });
        }, 100);

        // Emit event to start physics
        document.dispatchEvent(new CustomEvent('level-play'));

        // Disable button
        this.bg.setAttribute('color', '#666666');
        this.text.setAttribute('value', 'PLAYING...');
        this.el.classList.remove('interactive');
    }
});

// Component: Restart Button
AFRAME.registerComponent('level-restart-button', {
    schema: {
        position: { type: 'vec3', default: { x: 2, y: 1.6, z: -3 } }
    },

    init: function () {
        this.createButton();

        this.el.addEventListener('click', this.onRestart.bind(this));
        this.el.addEventListener('mouseenter', this.onHover.bind(this));
        this.el.addEventListener('mouseleave', this.onUnhover.bind(this));
    },

    createButton: function () {
        const bg = document.createElement('a-box');
        bg.setAttribute('width', 2);
        bg.setAttribute('height', 0.6);
        bg.setAttribute('depth', 0.1);
        bg.setAttribute('color', '#ff6600');
        bg.setAttribute('material', 'shader: flat');
        bg.classList.add('interactive');

        const text = document.createElement('a-text');
        text.setAttribute('value', 'RESTART ⟲');
        text.setAttribute('align', 'center');
        text.setAttribute('color', '#ffffff');
        text.setAttribute('width', 4);
        text.setAttribute('position', '0 0 0.06');
        text.setAttribute('font', 'roboto');

        this.el.appendChild(bg);
        this.el.appendChild(text);

        this.bg = bg;
    },

    onHover: function () {
        this.bg.setAttribute('color', '#ff8800');
        this.bg.setAttribute('animation', {
            property: 'scale',
            to: '1.1 1.1 1.1',
            dur: 200
        });
    },

    onUnhover: function () {
        this.bg.setAttribute('color', '#ff6600');
        this.bg.setAttribute('animation', {
            property: 'scale',
            to: '1 1 1',
            dur: 200
        });
    },

    onRestart: function () {
        console.log('🔄 Botão Restart pressionado');

        this.bg.setAttribute('animation', {
            property: 'scale',
            to: '0.95 0.95 0.95',
            dur: 100
        });

        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('level-restart'));
        }, 100);
    }
});

// Componente: Painel de Objetivo
AFRAME.registerComponent('objective-panel', {
    schema: {
        name: { type: 'string', default: 'GOAL' },
        objective: { type: 'string', default: '' },
        description: { type: 'string', default: '' }
    },

    init: function () {
        this.createPanel();
    },

    createPanel: function () {
        // Background
        const bg = document.createElement('a-plane');
        bg.setAttribute('width', 10);
        bg.setAttribute('height', 2);
        bg.setAttribute('color', '#1a1a2e');
        bg.setAttribute('material', 'opacity: 0.9; transparent: true');

        // Title
        const title = document.createElement('a-text');
        title.setAttribute('value', this.data.name.toUpperCase() || "GOAL");
        title.setAttribute('align', 'center');
        title.setAttribute('color', '#00ffff');
        title.setAttribute('width', 8);
        title.setAttribute('position', '0 0.5 0.02');


        // Goal text
        const objectiveText = document.createElement('a-text');
        objectiveText.setAttribute('id', 'objective-text');
        objectiveText.setAttribute('value', this.data.objective);
        objectiveText.setAttribute('align', 'center');
        objectiveText.setAttribute('color', '#ffffff');
        objectiveText.setAttribute('width', 9);
        objectiveText.setAttribute('position', '0 -.2 0.02');
        objectiveText.setAttribute('wrap-count', 50);
        this.el.appendChild(bg);
        this.el.appendChild(title);
        this.el.appendChild(objectiveText);
        // Description
        /*
        if (this.data.description) {
            const desc = document.createElement('a-text');
            desc.setAttribute('value', this.data.description);
            desc.setAttribute('align', 'center');
            desc.setAttribute('color', '#ffffff');
            desc.setAttribute('width', 9);
            desc.setAttribute('position', '0 -0.8 0.02');
            desc.setAttribute('wrap-count', 60);

            this.el.appendChild(desc);
        }
*/

    }
});

// Component: Victory Panel
AFRAME.registerComponent('victory-panel', {
    init: function () {
        this.createPanel();
        // Mantém painel invisível inicialmente e botões desabilitados para evitar cliques em elementos ocultos
        this.el.setAttribute('visible', false);
        if (this.btnNext) this.btnNext.setAttribute('vr-button', 'disabled: true');
        if (this.btnSelect) this.btnSelect.setAttribute('vr-button', 'disabled: true');

        // Listener para evento de vitória
        this.el.sceneEl.addEventListener('level-complete', this.onLevelComplete.bind(this));
    },

    createPanel: function () {
        // Larger background
        const bg = document.createElement('a-plane');
        bg.setAttribute('width', 6);
        bg.setAttribute('height', 4);
        bg.setAttribute('color', '#1a1a2e');
        bg.setAttribute('material', 'opacity: 0.95; transparent: true');

        // Victory title
        const title = document.createElement('a-text');
        title.setAttribute('value', '🎉 CONGRATULATIONS! 🎉');
        title.setAttribute('align', 'center');
        title.setAttribute('color', '#00ff00');
        title.setAttribute('width', 10);
        title.setAttribute('position', '0 1.3 0.01');
        title.setAttribute('font', 'roboto');

        // Message
        const message = document.createElement('a-text');
        message.setAttribute('value', 'Goal Achieved!');
        message.setAttribute('align', 'center');
        message.setAttribute('color', '#ffffff');
        message.setAttribute('width', 8);
        message.setAttribute('position', '0 0.7 0.01');

        // Stats
        const stats = document.createElement('a-text');
        stats.setAttribute('id', 'victory-stats');
        stats.setAttribute('value', 'Attempts: 1');
        stats.setAttribute('align', 'center');
        stats.setAttribute('color', '#aaaaaa');
        stats.setAttribute('width', 7);
        stats.setAttribute('position', '0 0.2 0.01');

        // Next Level Button
        const btnNext = document.createElement('a-entity');
        btnNext.setAttribute('id', 'btn-next-level');
        btnNext.setAttribute('position', '0 -0.5 0.01');
        btnNext.setAttribute('vr-button', {
            label: 'Next Level →',
            width: 2.5,
            height: 0.6,
            color: '#00ff88',
            action: 'next-level'
        });

        // Select Level Button
        const btnSelect = document.createElement('a-entity');
        btnSelect.setAttribute('id', 'btn-select-level');
        btnSelect.setAttribute('position', '0 -1.3 0.01');
        btnSelect.setAttribute('vr-button', {
            label: 'Select Level',
            width: 2.5,
            height: 0.6,
            color: '#4CC3D9',
            action: 'select-level'
        });

        // Celebration particles
        const particles = document.createElement('a-entity');
        particles.setAttribute('position', '0 1.5 0');
        particles.setAttribute('particle-system', {
            color: '#00ff00,#ffff00,#00ffff',
            particleCount: 100,
            maxAge: 3,
            accelerationValue: '0 -5 0',
            velocityValue: '0 10 0',
            velocitySpread: '5 2 5'
        });

        this.el.appendChild(bg);
        this.el.appendChild(title);
        this.el.appendChild(message);
        this.el.appendChild(stats);
        this.el.appendChild(btnNext);
        this.el.appendChild(btnSelect);
        this.el.appendChild(particles);

        // Event listeners for buttons
        btnNext.addEventListener('vr-button-clicked', this.onNextLevel.bind(this));
        btnSelect.addEventListener('vr-button-clicked', this.onSelectLevel.bind(this));

        // Guarda referências para habilitar/desabilitar depois
        this.btnNext = btnNext;
        this.btnSelect = btnSelect;
    },

    onLevelComplete: function (evt) {
        console.log('🎊 Showing victory panel');

        // Show panel with animation
        this.el.setAttribute('visible', true);
        this.el.setAttribute('animation', {
            property: 'scale',
            from: '0 0 0',
            to: '1 1 1',
            dur: 600,
            easing: 'easeOutElastic'
        });

        // Reabilita interatividade dos botões agora que o painel está visível
        if (this.btnNext) this.btnNext.setAttribute('vr-button', 'disabled: false');
        if (this.btnSelect) this.btnSelect.setAttribute('vr-button', 'disabled: false');

        // Pulse animation on title
        const title = this.el.querySelector('a-text');
        if (title) {
            title.setAttribute('animation__pulse', {
                property: 'scale',
                to: '1.1 1.1 1.1',
                dur: 1000,
                dir: 'alternate',
                loop: true
            });
        }
    },

    onNextLevel: function () {
        console.log('➡️ Going to next level');

        // Get current level from URL (parameter 'id')
        const currentLevel = parseInt(new URLSearchParams(window.location.search).get('id') || '1');
        const nextLevel = currentLevel + 1;

        if (nextLevel <= 12) {
            window.location.href = `level.html?id=${nextLevel}`;
        } else {
            console.log('🏆 All levels completed!');
            window.location.href = 'level-select.html';
        }
    },

    onSelectLevel: function () {
        console.log('🔙 Returning to level selection');
        window.location.href = 'level-select.html';
    }
});

// Component: Camera Follow for buttons (follows camera)
AFRAME.registerComponent('camera-follow', {
    schema: {
        offset: { type: 'vec3', default: { x: 0, y: 0, z: -3 } },
        smooth: { type: 'boolean', default: true },
        smoothFactor: { type: 'number', default: 0.1 }
    },

    init: function () {
        console.log('🎥 Camera-follow init para:', this.el.id);

        // Wait for scene to be ready before getting camera
        if (this.el.sceneEl.hasLoaded) {
            this.setup();
        } else {
            this.el.sceneEl.addEventListener('loaded', () => {
                this.setup();
            });
        }
    },

    setup: function () {
        this.camera = document.querySelector('[camera]');
        if (!this.camera) {
            console.warn('⚠️ Câmera não encontrada para camera-follow');
            return;
        }

        console.log('✅ Câmera encontrada:', this.camera.id);
        this.targetPosition = new THREE.Vector3();
        this.cameraWorldPos = new THREE.Vector3();
        this.cameraWorldQuat = new THREE.Quaternion();
        this.offsetVector = new THREE.Vector3();
        this.isReady = true;
    },

    tick: function () {
        if (!this.isReady || !this.camera) return;

        // Get camera world position and rotation (considering parent hierarchy)
        this.camera.object3D.getWorldPosition(this.cameraWorldPos);
        this.camera.object3D.getWorldQuaternion(this.cameraWorldQuat);

        // Set relative offset
        this.offsetVector.set(
            this.data.offset.x,
            this.data.offset.y,
            this.data.offset.z
        );

        // Apply camera rotation to offset
        this.offsetVector.applyQuaternion(this.cameraWorldQuat);

        // Calculate final position
        this.targetPosition.copy(this.cameraWorldPos).add(this.offsetVector);

        // DEBUG: Log every 60 frames (once per second at 60fps)
        if (!this.frameCount) this.frameCount = 0;
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            console.log(`📍 ${this.el.id} - Camera: (${this.cameraWorldPos.x.toFixed(1)}, ${this.cameraWorldPos.y.toFixed(1)}, ${this.cameraWorldPos.z.toFixed(1)}) -> Target: (${this.targetPosition.x.toFixed(1)}, ${this.targetPosition.y.toFixed(1)}, ${this.targetPosition.z.toFixed(1)})`);
        }

        // Apply position (smooth or immediate)
        if (this.data.smooth) {
            const currentPos = this.el.object3D.position;
            currentPos.lerp(this.targetPosition, this.data.smoothFactor);
        } else {
            this.el.object3D.position.copy(this.targetPosition);
        }

        // Always look at camera
        this.el.object3D.lookAt(this.cameraWorldPos);
    }
});

// Component: Celebration Effect
AFRAME.registerComponent('celebration-effect', {
    schema: {
        duration: { type: 'number', default: 3000 }
    },

    init: function () {
        this.el.sceneEl.addEventListener('level-complete', this.celebrate.bind(this));
    },

    celebrate: function () {
        console.log('🎆 Efeito de comemoração!');

        // Create fireworks/confetti
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createFirework();
            }, i * 300);
        }

        // Celebration sounds (if available)
        this.el.emit('celebration-sound');
    },

    createFirework: function () {
        const firework = document.createElement('a-entity');
        const randomX = (Math.random() - 0.5) * 10;
        const randomZ = (Math.random() - 0.5) * 10 - 5;

        firework.setAttribute('position', `${randomX} 0.5 ${randomZ}`);
        firework.setAttribute('particle-system', {
            color: this.getRandomColor(),
            particleCount: 50,
            maxAge: 2,
            accelerationValue: '0 -2 0',
            velocityValue: '0 8 0',
            velocitySpread: '3 3 3'
        });

        this.el.sceneEl.appendChild(firework);

        // Remove after animation
        setTimeout(() => {
            firework.remove();
        }, 2500);
    },

    getRandomColor: function () {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
});

// Register components
console.log('✅ Level UI Components loaded');
