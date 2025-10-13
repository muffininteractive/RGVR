// VR UI Components - Sistema de interface 3D para VR
// Componentes reutilizáveis para criar interfaces em realidade virtual

// Componente: Botão 3D interativo
AFRAME.registerComponent('vr-button', {
    schema: {
        label: { type: 'string', default: 'Button' },
        width: { type: 'number', default: 2 },
        height: { type: 'number', default: 0.6 },
        color: { type: 'color', default: '#4CC3D9' },
        hoverColor: { type: 'color', default: '#00A0D9' },
        textColor: { type: 'color', default: '#FFFFFF' },
        fontSize: { type: 'number', default: 0.3 },
        action: { type: 'string', default: '' },
        disabled: { type: 'boolean', default: false }
    },

    init: function () {
        this.isHovered = false;
        this.originalColor = this.data.color;

        // Cria o painel do botão
        this.panel = document.createElement('a-box');
        this.panel.setAttribute('width', this.data.width);
        this.panel.setAttribute('height', this.data.height);
        this.panel.setAttribute('depth', 0.1);
        this.panel.setAttribute('color', this.data.color);
        this.panel.setAttribute('material', 'shader: flat');
        this.panel.classList.add('interactive');

        // Cria o texto do botão
        this.text = document.createElement('a-text');
        this.text.setAttribute('value', this.data.label);
        this.text.setAttribute('align', 'center');
        this.text.setAttribute('color', this.data.textColor);
        this.text.setAttribute('width', this.data.width * 2);
        this.text.setAttribute('position', `0 0 0.06`);
        this.text.setAttribute('font', 'roboto');

        this.el.appendChild(this.panel);
        this.el.appendChild(this.text);

        // Event listeners
        this.el.addEventListener('mouseenter', this.onHover.bind(this));
        this.el.addEventListener('mouseleave', this.onUnhover.bind(this));
        this.el.addEventListener('click', this.onClick.bind(this));

        // Para controles VR
        this.el.addEventListener('triggerdown', this.onClick.bind(this));
    },

    update: function (oldData) {
        if (this.text && oldData.label !== this.data.label) {
            this.text.setAttribute('value', this.data.label);
        }
        if (this.data.disabled) {
            this.panel.setAttribute('color', '#666666');
            this.el.classList.remove('interactive');
        } else {
            this.panel.setAttribute('color', this.data.color);
            this.el.classList.add('interactive');
        }
    },

    onHover: function () {
        if (this.data.disabled) return;

        this.isHovered = true;
        this.panel.setAttribute('color', this.data.hoverColor);
        this.panel.setAttribute('animation', {
            property: 'scale',
            to: '1.05 1.05 1.05',
            dur: 200
        });

        // Feedback sonoro (se disponível)
        this.el.emit('button-hovered');
    },

    onUnhover: function () {
        if (this.data.disabled) return;

        this.isHovered = false;
        this.panel.setAttribute('color', this.data.color);
        this.panel.setAttribute('animation', {
            property: 'scale',
            to: '1 1 1',
            dur: 200
        });
    },

    onClick: function () {
        if (this.data.disabled) return;

        console.log('VR Button clicked:', this.data.label, 'Action:', this.data.action);

        // Animação de clique
        this.panel.setAttribute('animation', {
            property: 'scale',
            to: '0.95 0.95 0.95',
            dur: 100
        });

        setTimeout(() => {
            this.panel.setAttribute('animation', {
                property: 'scale',
                to: '1 1 1',
                dur: 100
            });
        }, 100);

        // Emite evento customizado com a ação
        this.el.emit('vr-button-clicked', { action: this.data.action, label: this.data.label });

        // Feedback sonoro
        this.el.emit('button-clicked');
    }
});

// Componente: Painel de informações 3D
AFRAME.registerComponent('vr-panel', {
    schema: {
        title: { type: 'string', default: '' },
        content: { type: 'string', default: '' },
        width: { type: 'number', default: 3 },
        height: { type: 'number', default: 2 },
        backgroundColor: { type: 'color', default: '#1a1a2e' },
        textColor: { type: 'color', default: '#FFFFFF' },
        opacity: { type: 'number', default: 0.9 }
    },

    init: function () {
        // Cria o fundo do painel
        this.background = document.createElement('a-plane');
        this.background.setAttribute('width', this.data.width);
        this.background.setAttribute('height', this.data.height);
        this.background.setAttribute('color', this.data.backgroundColor);
        this.background.setAttribute('material', `opacity: ${this.data.opacity}; transparent: true`);

        // Cria o título
        if (this.data.title) {
            this.titleText = document.createElement('a-text');
            this.titleText.setAttribute('value', this.data.title);
            this.titleText.setAttribute('align', 'center');
            this.titleText.setAttribute('color', this.data.textColor);
            this.titleText.setAttribute('width', this.data.width * 1.8);
            this.titleText.setAttribute('position', `0 ${this.data.height / 2 - 0.3} 0.01`);
            this.titleText.setAttribute('font', 'roboto');
            this.titleText.setAttribute('wrap-count', 40);
        }

        // Cria o conteúdo
        if (this.data.content) {
            this.contentText = document.createElement('a-text');
            this.contentText.setAttribute('value', this.data.content);
            this.contentText.setAttribute('align', 'center');
            this.contentText.setAttribute('color', this.data.textColor);
            this.contentText.setAttribute('width', this.data.width * 2);
            this.contentText.setAttribute('position', `0 0 0.01`);
            this.contentText.setAttribute('font', 'roboto');
            this.contentText.setAttribute('wrap-count', 50);
        }

        this.el.appendChild(this.background);
        if (this.titleText) this.el.appendChild(this.titleText);
        if (this.contentText) this.el.appendChild(this.contentText);
    },

    update: function (oldData) {
        if (this.titleText && oldData.title !== this.data.title) {
            this.titleText.setAttribute('value', this.data.title);
        }
        if (this.contentText && oldData.content !== this.data.content) {
            this.contentText.setAttribute('value', this.data.content);
        }
    },

    updateContent: function (content) {
        if (this.contentText) {
            this.contentText.setAttribute('value', content);
        }
    },

    updateTitle: function (title) {
        if (this.titleText) {
            this.titleText.setAttribute('value', title);
        }
    }
});

// Componente: Menu VR com múltiplas opções
AFRAME.registerComponent('vr-menu', {
    schema: {
        title: { type: 'string', default: 'Menu' },
        options: { type: 'array', default: [] }
    },

    init: function () {
        this.createMenu();
    },

    createMenu: function () {
        // Título do menu
        const title = document.createElement('a-text');
        title.setAttribute('value', this.data.title);
        title.setAttribute('align', 'center');
        title.setAttribute('color', '#00FFFF');
        title.setAttribute('width', 8);
        title.setAttribute('position', '0 2 0');
        title.setAttribute('font', 'roboto');
        this.el.appendChild(title);

        // Cria botões para cada opção
        this.data.options.forEach((option, index) => {
            const button = document.createElement('a-entity');
            button.setAttribute('vr-button', {
                label: option.label || `Option ${index + 1}`,
                width: 2.5,
                height: 0.6,
                color: option.color || '#4CC3D9',
                action: option.action || `option-${index}`
            });

            // Posiciona os botões verticalmente
            const yPos = 1 - (index * 0.8);
            button.setAttribute('position', `0 ${yPos} 0`);

            this.el.appendChild(button);
        });
    }
});

// Componente: HUD fixo na câmera
AFRAME.registerComponent('vr-hud', {
    schema: {
        distance: { type: 'number', default: 1.5 },
        yOffset: { type: 'number', default: 0.5 }
    },

    init: function () {
        this.camera = document.querySelector('[camera]');
        this.updatePosition();
    },

    tick: function () {
        // Mantém o HUD sempre à frente da câmera
        if (this.camera) {
            this.updatePosition();
        }
    },

    updatePosition: function () {
        if (!this.camera) return;

        const cameraPosition = this.camera.object3D.position;
        const cameraRotation = this.camera.object3D.rotation;

        // Calcula posição à frente da câmera
        const offset = new THREE.Vector3(0, this.data.yOffset, -this.data.distance);
        offset.applyEuler(cameraRotation);
        offset.add(cameraPosition);

        this.el.object3D.position.copy(offset);

        // Rotaciona para olhar para a câmera
        this.el.object3D.lookAt(cameraPosition);
    }
});

// Componente: Texto de feedback flutuante
AFRAME.registerComponent('vr-feedback', {
    schema: {
        message: { type: 'string', default: '' },
        duration: { type: 'number', default: 3000 },
        color: { type: 'color', default: '#FFFFFF' }
    },

    init: function () {
        this.showFeedback();
    },

    update: function (oldData) {
        if (oldData.message !== this.data.message) {
            this.showFeedback();
        }
    },

    showFeedback: function () {
        if (!this.data.message) return;

        // Remove feedback anterior
        while (this.el.firstChild) {
            this.el.removeChild(this.el.firstChild);
        }

        // Cria novo texto
        const text = document.createElement('a-text');
        text.setAttribute('value', this.data.message);
        text.setAttribute('align', 'center');
        text.setAttribute('color', this.data.color);
        text.setAttribute('width', 4);
        text.setAttribute('font', 'roboto');
        text.setAttribute('wrap-count', 40);

        // Animação de entrada
        text.setAttribute('animation', {
            property: 'position',
            from: '0 -0.5 0',
            to: '0 0 0',
            dur: 300
        });

        this.el.appendChild(text);

        // Remove após duração
        if (this.data.duration > 0) {
            setTimeout(() => {
                if (text.parentNode === this.el) {
                    text.setAttribute('animation', {
                        property: 'material.opacity',
                        to: 0,
                        dur: 500
                    });
                    setTimeout(() => {
                        if (text.parentNode === this.el) {
                            this.el.removeChild(text);
                        }
                    }, 500);
                }
            }, this.data.duration);
        }
    }
});

// Componente: Cursor VR melhorado
AFRAME.registerComponent('vr-cursor-visual', {
    init: function () {
        // Adiciona visual ao cursor
        const ring = document.createElement('a-ring');
        ring.setAttribute('radius-inner', 0.01);
        ring.setAttribute('radius-outer', 0.015);
        ring.setAttribute('color', '#00FFFF');
        ring.setAttribute('material', 'shader: flat');

        this.el.appendChild(ring);

        // Animação de hover
        this.el.addEventListener('raycaster-intersection', () => {
            ring.setAttribute('animation', {
                property: 'scale',
                to: '1.5 1.5 1.5',
                dur: 200
            });
            ring.setAttribute('color', '#00FF00');
        });

        this.el.addEventListener('raycaster-intersection-cleared', () => {
            ring.setAttribute('animation', {
                property: 'scale',
                to: '1 1 1',
                dur: 200
            });
            ring.setAttribute('color', '#00FFFF');
        });
    }
});

console.log('VR UI Components loaded successfully!');
