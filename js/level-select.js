// Estado da seleção de nível
let levelSelectState = {
    selectedLevel: null,
    hoveredLevel: null,
    levelData: null
};

// Componente para seleção de nível
AFRAME.registerComponent('level-selector', {
    schema: {
        levelId: { type: 'number', default: 1 },
        difficulty: { type: 'string', default: 'easy' }
    },

    init: function () {
        this.levelId = this.data.levelId;
        this.difficulty = this.data.difficulty;
        this.crystal = this.el.querySelector('a-octahedron');
        this.isSelected = false;
        this.isHovered = false;

        // Escala padrão fixa
        this.normalScale = '1 1 1';
        this.hoverScale = '1.3 1.3 1.3';
        this.selectedScale = '1.4 1.4 1.4';
        this.crystal.setAttribute('scale', this.normalScale);
        this.originalColor = this.crystal.getAttribute('color');
        this.originalEmissiveIntensity = 0;

        // Marca como completado se já foi feito
        this.checkCompletion();

        // Event listeners
        this.el.addEventListener('mouseenter', this.onHover.bind(this));
        this.el.addEventListener('mouseleave', this.onUnhover.bind(this));
        // Eventos de raycaster para VR (laser-controls)
        this.el.addEventListener('raycaster-intersected', this.onHover.bind(this));
        this.el.addEventListener('raycaster-intersected-cleared', this.onUnhover.bind(this));
        this.el.addEventListener('click', this.onSelect.bind(this));

        // Para controles VR
        this.crystal.addEventListener('click', this.onSelect.bind(this));

        // Helper para transicionar escala suavemente
        this.setCrystalScale = (targetScale, dur = 220) => {
            // Remove animação anterior
            this.crystal.removeAttribute('animation__scale');
            this.crystal.setAttribute('animation__scale', {
                property: 'scale',
                to: targetScale,
                dur,
                easing: 'easeOutCubic'
            });
        };
    },

    checkCompletion: function () {
        try {
            const completedLevels = JSON.parse(localStorage.getItem('rgvr-completed-levels') || '[]');
            if (completedLevels.includes(this.levelId)) {
                // Adiciona indicador visual de completado
                const checkmark = document.createElement('a-text');
                checkmark.setAttribute('value', '✓');
                checkmark.setAttribute('position', '0 1.5 0');
                checkmark.setAttribute('align', 'center');
                checkmark.setAttribute('color', '#00ff00');
                checkmark.setAttribute('width', 3);
                this.el.appendChild(checkmark);
            }
        } catch (error) {
            console.error('Erro ao verificar níveis completados:', error);
        }
    },

    onHover: function () {
        if (this.isSelected) return;

        this.isHovered = true;
        levelSelectState.hoveredLevel = this.levelId;

        // Efeito visual de hover
        // Remove possíveis animações antigas antes de aplicar novas
        // Aplica escala de hover diretamente
        this.setCrystalScale(this.hoverScale);

        this.crystal.setAttribute('animation__glow', {
            property: 'material.emissiveIntensity',
            to: 0.5,
            dur: 300
        });

        // Atualiza interface VR
        LevelSelectManager.updateLevelInfoVR(this.levelId);

        console.log(`Hovering over level: ${this.levelId}`);
    },

    onUnhover: function () {
        if (this.isSelected) return; // mantém efeito de seleção

        this.isHovered = false;
        levelSelectState.hoveredLevel = null;

        // Remove efeito visual
        // Remove animações se existirem
        this.crystal.removeAttribute('animation__hover');
        this.crystal.removeAttribute('animation__glow');
        // Restaura escala padrão
        this.setCrystalScale(this.normalScale, 180);
        // Restaura emissiveIntensity
        this.crystal.setAttribute('material', `metalness: 0.3; roughness: 0.1; transparent: true; opacity: 0.8; emissive: ${this.originalColor}; emissiveIntensity: ${this.originalEmissiveIntensity}`);

        // Limpa interface se não há nível selecionado
        if (!levelSelectState.selectedLevel) {
            LevelSelectManager.clearLevelInfoVR();
        }
    },

    onSelect: function () {
        console.log(`Selected level: ${this.levelId}`);

        // Deseleciona outros níveis
        document.querySelectorAll('[level-selector]').forEach(el => {
            const component = el.components['level-selector'];
            if (component && component !== this) {
                component.deselect();
            }
        });

        // Seleciona este nível
        this.select();

        // Atualiza estado global
        levelSelectState.selectedLevel = this.levelId;
        LevelSelectManager.onLevelSelected(this.levelId);
    },

    select: function () {
        this.isSelected = true;

        // Efeito visual de seleção
        // Escala de seleção fixa
        this.setCrystalScale(this.selectedScale, 280);

        this.crystal.setAttribute('animation__pulse', {
            property: 'material.emissiveIntensity',
            to: 0.8,
            dur: 1000,
            dir: 'alternate',
            loop: true
        });

        // Adiciona anel de seleção
        this.addSelectionRing();
    },

    deselect: function () {
        this.isSelected = false;

        // Remove animações
        this.crystal.removeAttribute('animation__select');
        this.crystal.removeAttribute('animation__pulse');
        this.setCrystalScale(this.normalScale, 250);
        this.crystal.setAttribute('material.emissiveIntensity', 0);

        // Remove anel de seleção
        this.removeSelectionRing();
    },

    addSelectionRing: function () {
        if (this.selectionRing) return;

        this.selectionRing = document.createElement('a-torus');
        this.selectionRing.setAttribute('position', '0 0 0');
        this.selectionRing.setAttribute('radius', 1.2);
        this.selectionRing.setAttribute('radius-tubular', 0.03);
        this.selectionRing.setAttribute('color', '#ffffff');
        this.selectionRing.setAttribute('material', 'emissive: #00ffff; emissiveIntensity: 0.5');
        this.selectionRing.setAttribute('animation', {
            property: 'rotation',
            to: '0 359 0',
            dur: 3000,
            loop: true,
            easing: 'linear'
        });

        this.el.appendChild(this.selectionRing);
    },

    removeSelectionRing: function () {
        if (this.selectionRing) {
            this.el.removeChild(this.selectionRing);
            this.selectionRing = null;
        }
    }
});

// Componente para interação com controles VR
AFRAME.registerComponent('level-interaction', {
    init: function () {
        this.el.addEventListener('triggerdown', this.onTriggerDown.bind(this));
    },

    onTriggerDown: function () {
        const raycasterComponent = this.el.components.raycaster;
        if (!raycasterComponent) return;

        const intersections = raycasterComponent.intersections;
        if (intersections && intersections.length > 0) {
            const intersection = intersections[0];
            const levelEntity = intersection.object.el.closest('[level-selector]');

            if (levelEntity) {
                // Simula click
                levelEntity.emit('click');
            }
        }
    }
});

// Gerenciador principal da seleção de nível
class LevelSelectManager {
    static async init() {
        console.log('Inicializando Level Select...');

        await this.loadLevelData();
        // Após carregar dados, gerar cristais dinamicamente
        this.buildCrystals();
        this.setupEventListeners();
        this.setupCarouselControls();
        this.setupThumbstickControls();

        console.log('Level Select initialized');
    }

    static async loadLevelData() {
        try {
            const response = await fetch('../data/levels-data.json');
            const data = await response.json();

            // Converte array de níveis em objeto indexado por ID
            levelSelectState.levelData = {};
            data.levels.forEach(level => {
                levelSelectState.levelData[level.id] = level;
            });

            console.log('✅ Dados de 12 níveis carregados:', levelSelectState.levelData);
        } catch (error) {
            console.error('❌ Erro ao carregar dados dos níveis:', error);
            // Dados de fallback básicos
            levelSelectState.levelData = {};
            for (let i = 1; i <= 12; i++) {
                levelSelectState.levelData[i] = {
                    id: i,
                    name: `level ${i}`,
                    difficulty: i <= 3 ? 'easy' : i <= 6 ? 'medium' : i <= 9 ? 'hard' : 'expert',
                    objective: 'Complete o desafio',
                    description: 'Descrição do nível'
                };
            }
        }
    }

    static setupEventListeners() {
        // Botão Voltar
        const btnBack = document.getElementById('btn-back');
        btnBack?.addEventListener('vr-button-clicked', () => {
            console.log('Back button clicked');
            window.location.href = '../index.html';
        });

        // Botão Select
        const btnSelect = document.getElementById('btn-select');
        btnSelect?.addEventListener('vr-button-clicked', () => {
            if (levelSelectState.selectedLevel) {
                this.startLevel(levelSelectState.selectedLevel);
            }
        });
    }

    // ===== Carrossel: rotação por passo =====
    static setupCarouselControls() {
        this.carouselEl = document.getElementById('level-crystals');
        this.rotateBtn = document.getElementById('rotate-right');
        this.rotateLeftBtn = document.getElementById('rotate-left');
        // Som opcional via elemento <audio id="navSound"> na cena
        this.navSoundEl = document.getElementById('navSound');
        this._audioCtx = null;


        if (!this.carouselEl) {
            console.warn('⚠️ Elemento do carrossel #level-crystals não encontrado.');
            return;
        }

        // Estado interno
        this._isRotating = false;
        // Define passo de rotação baseado na quantidade de níveis
        const levelCount = Object.keys(levelSelectState.levelData || {}).length || 12;
        this._stepDeg = 360 / levelCount;

        // Clique nos triângulos (setas)
        if (this.rotateBtn) {
            // Garante que seja clicável pelos raycasters
            this.rotateBtn.classList.add('interactive');
            this.rotateBtn.addEventListener('click', () => this.rotateCarousel(1));
        }
        if (this.rotateLeftBtn) {
            this.rotateLeftBtn.classList.add('interactive');
            this.rotateLeftBtn.addEventListener('click', () => this.rotateCarousel(-1));
        }
    }

    static _ensureAudioContext() {
        if (!this._audioCtx) {
            try {
                this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('WebAudio indisponível:', e);
            }
        }
        return this._audioCtx;
    }

    static _beep() {
        const ctx = this._ensureAudioContext();
        if (!ctx) return;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(880, ctx.currentTime); // beep curto e agudo
        g.gain.setValueAtTime(0.05, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.13);
    }

    static _playNavSound() {
        // Tenta tocar o elemento <audio>, cai no beep via WebAudio se falhar
        if (this.navSoundEl && typeof this.navSoundEl.play === 'function') {
            try {
                this.navSoundEl.currentTime = 0;
                const p = this.navSoundEl.play();
                if (p && typeof p.catch === 'function') {
                    p.catch(() => this._beep());
                }
            } catch {
                this._beep();
            }
        } else {
            this._beep();
        }
    }

    static getCurrentYaw() {
        if (!this.carouselEl) return 0;
        const rot = this.carouselEl.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
        return rot.y || 0;
    }

    static normalizeYawToStep(yaw) {
        // Normaliza para múltiplos de 30° (inteiro mais próximo)
        const step = Math.round(yaw / this._stepDeg);
        return step * this._stepDeg;
    }

    static getFrontLevelIdForYaw(yaw) {
        // 0° => level 1, +30° => level 2, ...
        const step = Math.round(yaw / this._stepDeg);
        const idx = ((step % 12) + 12) % 12; // 0..11
        return idx + 1; // 1..12
    }

    static rotateCarousel(steps = 1) {
        if (!this.carouselEl || this._isRotating) return;

        const curYaw = this.getCurrentYaw();
        const snapped = this.normalizeYawToStep(curYaw);
        const targetYaw = snapped + steps * this._stepDeg; // +30° gira para o próximo cristal à direita

        this._isRotating = true;
        // Som de navegação
        this._playNavSound();
        // Remove animação anterior (se existir) para evitar conflito
        this.carouselEl.removeAttribute('animation__carousel');
        this.carouselEl.setAttribute('animation__carousel', {
            property: 'rotation',
            to: `0 ${targetYaw} 0`,
            dur: 400,
            easing: 'easeOutCubic'
        });

        const onDone = () => {
            // Encerra e faz snap exato ao ângulo de destino
            this.carouselEl.setAttribute('rotation', `0 ${targetYaw} 0`);
            this.carouselEl.removeEventListener('animationcomplete', onDone);
            this._isRotating = false;

            // Atualiza info do nível em frente (sem auto-selecionar)
            const frontId = this.getFrontLevelIdForYaw(targetYaw);
            this.updateLevelInfoVR(frontId);
            levelSelectState.hoveredLevel = frontId;
        };

        // Escuta apenas o término desta animação específica
        const onAnimComplete = (evt) => {
            if (evt.detail && evt.detail.name === 'animation__carousel') {
                onDone();
                this.carouselEl.removeEventListener('animationcomplete', onAnimComplete);
            }
        };
        this.carouselEl.addEventListener('animationcomplete', onAnimComplete);
    }

    // ===== Geração dinâmica dos cristais =====
    static buildCrystals() {
        if (!this.carouselEl) this.carouselEl = document.getElementById('level-crystals');
        if (!this.carouselEl) {
            console.warn('Elemento #level-crystals não encontrado para gerar cristais.');
            return;
        }
        // Limpa qualquer conteúdo existente
        while (this.carouselEl.firstChild) {
            this.carouselEl.removeChild(this.carouselEl.firstChild);
        }

        const levels = levelSelectState.levelData;
        if (!levels) return;

        const levelIds = Object.keys(levels).map(id => parseInt(id, 10)).sort((a, b) => a - b);
        const radius = 8; // Raio do círculo
        const baseY = 2.5;

        levelIds.forEach((id, index) => {
            const level = levels[id];
            const angleDeg = (index / levelIds.length) * 360; // Distribuição uniforme
            const angleRad = angleDeg * Math.PI / 180;
            const x = radius * Math.sin(angleRad);
            const z = -radius * Math.cos(angleRad); // negativo para manter orientação inicial
            const y = baseY;

            // Mapeia dificuldade para propriedades visuais
            const diffProps = this._getDifficultyProps(level.difficulty, id);

            const levelEntity = document.createElement('a-entity');
            levelEntity.setAttribute('id', `level-${id}`);
            levelEntity.setAttribute('position', `${x.toFixed(2)} ${y} ${z.toFixed(2)}`);
            levelEntity.setAttribute('level-selector', `levelId: ${id}; difficulty: ${level.difficulty}`);

            // Cristal
            const crystal = document.createElement('a-octahedron');
            crystal.setAttribute('position', '0 0 0');
            crystal.setAttribute('radius', diffProps.radius);
            crystal.setAttribute('color', diffProps.color);
            crystal.setAttribute('shadow', 'cast: true');
            crystal.setAttribute('material', `metalness: 0.3; roughness: 0.1; transparent: true; opacity: 0.8; emissive: ${diffProps.color}; emissiveIntensity: 0`);
            crystal.setAttribute('animation', diffProps.animation);
            crystal.classList.add('level-crystal', 'interactive');
            levelEntity.appendChild(crystal);

            // Texto
            const label = document.createElement('a-text');
            label.setAttribute('value', id);
            label.setAttribute('position', '0 1 0');
            label.setAttribute('align', 'center');
            label.setAttribute('color', diffProps.color);
            label.setAttribute('width', 4);
            // Rotaciona label para olhar para o centro (0, *, 0)
            // Como o nível está em (x, y, z), o ângulo para o centro é o ângulo atual + 180° no eixo Y
            // Cálculo correto: cristal em ângulo angleDeg (0° está em z negativo). Para o texto olhar para (0,0,0), yaw deve ser -angleDeg.
            // Ajuste fino: normaliza para intervalo 0..360 para evitar valores negativos.
            let faceCenterYaw = (-angleDeg) % 360;
            if (faceCenterYaw < 0) faceCenterYaw += 360;
            label.setAttribute('rotation', `0 ${faceCenterYaw} 0`);
            levelEntity.appendChild(label);

            this.carouselEl.appendChild(levelEntity);
        });
    }

    static _getDifficultyProps(difficulty, id) {
        switch (difficulty) {
            case 'easy':
                return { color: '#00ff88', radius: 0.7, animation: 'property: rotation; to: 0 360 0; dur: 8000; loop: true;easing: linear;' };
            case 'medium':
                return { color: '#ffdd00', radius: 0.8, animation: 'property: rotation; to: 360 0 360; dur: 6000; loop: true;easing: linear;' };
            case 'hard':
                return { color: '#ff8800', radius: 0.9, animation: 'property: rotation; to: 0 360 720; dur: 4000; loop: true;easing: linear;' };
            case 'expert':
                return { color: '#ff0044', radius: 1.0, animation: 'property: rotation; to: 720 360 0; dur: 3000; loop: true;easing: linear;' };
            default:
                return { color: '#8888ff', radius: 0.75, animation: 'property: rotation; to: 0 360 0; dur: 7000; loop: true;easing: linear;' };
        }
    }

    // ===== Thumbstick (VR) =====
    static setupThumbstickControls() {
        const left = document.getElementById('leftController');
        const right = document.getElementById('rightController');
        if (!left && !right) return;

        this._thumbDeadzone = 0.6;
        this._thumbCooling = false;

        const handler = (evt) => {
            if (this._thumbCooling || this._isRotating) return;
            const { x } = evt.detail || { x: 0 };
            if (x > this._thumbDeadzone) {
                this.rotateCarousel(1);
                // Cooldown para evitar múltiplos giros enquanto segurado
                this._thumbCooling = true;
                setTimeout(() => (this._thumbCooling = false), 350);
            } else if (x < -this._thumbDeadzone) {
                this.rotateCarousel(-1);
                this._thumbCooling = true;
                setTimeout(() => (this._thumbCooling = false), 350);
            }
        };

        left?.addEventListener('thumbstickmoved', handler);
        right?.addEventListener('thumbstickmoved', handler);
    }

    static updateLevelInfoVR(levelId) {
        const levelInfoPanel = document.getElementById('level-info-panel');
        const levelTitle = document.getElementById('level-title');
        const levelDesc = document.getElementById('level-desc');
        const levelStats = document.getElementById('level-stats');

        if (!levelSelectState.levelData) return;

        const level = levelSelectState.levelData[levelId];
        if (level && levelInfoPanel) {
            levelInfoPanel.setAttribute('visible', true);

            if (levelTitle) {
                levelTitle.setAttribute('value', `Level ${levelId} - ${level.name.toUpperCase()}`);
            }
            if (levelDesc) {
                levelDesc.setAttribute('value', level.objective);
            }
            if (levelStats) {
                const difficultyLabel = {
                    'easy': 'Easy',
                    'medium': 'Medium',
                    'hard': 'Hard',
                    'expert': 'Expert'
                }[level.difficulty] || level.difficulty;

                levelStats.setAttribute('value', `${difficultyLabel}`);
            }
        }
    }

    static clearLevelInfoVR() {
        const levelInfoPanel = document.getElementById('level-info-panel');
        if (levelInfoPanel) {
            levelInfoPanel.setAttribute('visible', false);
        }
    }

    static onLevelSelected(levelId) {
        console.log(`Level selected: ${levelId}`);

        // Habilita botão de select
        const btnSelect = document.getElementById('btn-select');
        if (btnSelect) {
            btnSelect.setAttribute('vr-button', 'disabled', false);
        }

        // Efeito sonoro (se disponível)
        const selectSound = document.getElementById('selectSound');
        if (selectSound) {
            selectSound.play().catch(e => console.log('Audio não disponível'));
        }

        // Atualiza info do nível
        this.updateLevelInfoVR(levelId);
    }

    static startLevel(levelId) {
        console.log(`Starting level: ${levelId}`);

        // Navega para a página dinâmica do nível com query parameter
        window.location.href = `level.html?id=${levelId}`;
    }

    // Efeito de partículas para celebração
    static playSelectionEffect(position) {
        const colors = ['#00ff88', '#ffdd00', '#ff8800', '#ff0044'];

        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const particle = document.createElement('a-sphere');
                particle.setAttribute('radius', 0.05);
                particle.setAttribute('color', colors[Math.floor(Math.random() * colors.length)]);
                particle.setAttribute('material', 'transparent: true');
                particle.setAttribute('position', position);
                particle.setAttribute('animation', {
                    property: 'position',
                    to: `${position.x + (Math.random() - 0.5) * 4} ${position.y + Math.random() * 3} ${position.z + (Math.random() - 0.5) * 4}`,
                    dur: 1500
                });
                particle.setAttribute('animation__opacity', {
                    property: 'material.opacity',
                    to: 0,
                    dur: 1500
                });

                document.querySelector('a-scene').appendChild(particle);

                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 2000);
            }, i * 100);
        }
    }

    // Obtém progresso do jogador
    static getCompletedLevels() {
        try {
            return JSON.parse(localStorage.getItem('rgvr-completed-levels') || '[]');
        } catch (error) {
            console.error('Erro ao carregar progresso:', error);
            return [];
        }
    }
}

// Inicialização quando a cena carregar
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        LevelSelectManager.init();
    } else {
        scene.addEventListener('loaded', () => {
            LevelSelectManager.init();
        });
    }
});

// Exporta para debug
window.LevelSelectManager = LevelSelectManager;
window.levelSelectState = levelSelectState;
