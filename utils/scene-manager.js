// Scene Manager - RGVR
// Gerenciador para navegação entre cenas e persistência de dados

class SceneManager {
    static gameData = {};
    static currentScene = null;
    static sceneHistory = [];
    
    static scenes = {
        'tutorial': '../scenes/tutorial.html',
        'level-select': '../scenes/level-select.html', 
        'game': '../scenes/game.html',
        'main': '../index.html'
    };

    /**
     * Carrega uma nova cena
     * @param {string} sceneName - Nome da cena a ser carregada
     * @param {Object} data - Dados opcionais para passar para a nova cena
     */
    static loadScene(sceneName, data = {}) {
        console.log(`Loading scene: ${sceneName}`);
        
        if (!this.scenes[sceneName]) {
            console.error(`Scene '${sceneName}' not found!`);
            return;
        }

        // Salva dados se fornecidos
        if (Object.keys(data).length > 0) {
            this.setGameData(data);
        }

        // Adiciona cena atual ao histórico
        if (this.currentScene) {
            this.sceneHistory.push(this.currentScene);
        }

        // Atualiza cena atual
        this.currentScene = sceneName;

        // Salva estado no sessionStorage
        this.saveState();

        // Efeito de transição
        this.showTransition(() => {
            // Redireciona para nova cena
            window.location.href = this.scenes[sceneName];
        });
    }

    /**
     * Volta para a cena anterior
     */
    static goBack() {
        if (this.sceneHistory.length > 0) {
            const previousScene = this.sceneHistory.pop();
            this.currentScene = previousScene;
            this.saveState();
            window.location.href = this.scenes[previousScene];
        } else {
            // Se não há histórico, vai para o tutorial
            this.loadScene('tutorial');
        }
    }

    /**
     * Define dados do jogo a serem passados entre cenas
     * @param {Object} data - Dados do jogo
     */
    static setGameData(data) {
        this.gameData = { ...this.gameData, ...data };
        this.saveState();
        console.log('Game data updated:', this.gameData);
    }

    /**
     * Obtém dados do jogo
     * @param {string} key - Chave específica dos dados (opcional)
     * @returns {any} Dados do jogo ou valor específico
     */
    static getGameData(key = null) {
        if (key) {
            return this.gameData[key];
        }
        return this.gameData;
    }

    /**
     * Limpa dados do jogo
     */
    static clearGameData() {
        this.gameData = {};
        this.saveState();
    }

    /**
     * Salva estado no sessionStorage
     */
    static saveState() {
        const state = {
            currentScene: this.currentScene,
            sceneHistory: this.sceneHistory,
            gameData: this.gameData,
            timestamp: Date.now()
        };
        
        try {
            sessionStorage.setItem('rgvr-scene-state', JSON.stringify(state));
        } catch (error) {
            console.error('Erro ao salvar estado:', error);
        }
    }

    /**
     * Carrega estado do sessionStorage
     */
    static loadState() {
        try {
            const stateJson = sessionStorage.getItem('rgvr-scene-state');
            if (stateJson) {
                const state = JSON.parse(stateJson);
                
                // Verifica se o estado não é muito antigo (1 hora)
                if (Date.now() - state.timestamp < 3600000) {
                    this.currentScene = state.currentScene;
                    this.sceneHistory = state.sceneHistory || [];
                    this.gameData = state.gameData || {};
                    
                    console.log('Estado carregado:', state);
                    return state;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar estado:', error);
        }
        
        return null;
    }

    /**
     * Detecta a cena atual baseada na URL
     */
    static detectCurrentScene() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        // Mapeia arquivos para nomes de cena
        const fileToScene = {
            'tutorial.html': 'tutorial',
            'level-select.html': 'level-select',
            'game.html': 'game',
            'index.html': 'main'
        };
        
        const scene = fileToScene[filename] || 'main';
        this.currentScene = scene;
        
        console.log(`Current scene detected: ${scene}`);
        return scene;
    }

    /**
     * Mostra efeito de transição entre cenas
     * @param {Function} callback - Função a ser executada após a transição
     */
    static showTransition(callback) {
        // Cria overlay de transição se não existir
        let overlay = document.getElementById('scene-transition');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'scene-transition';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(45deg, #1a1a2e, #16213e, #0f3460);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.5s ease;
                pointer-events: none;
            `;
            
            // Adiciona spinner de loading
            const spinner = document.createElement('div');
            spinner.innerHTML = `
                <div style="
                    width: 60px;
                    height: 60px;
                    border: 4px solid rgba(255,255,255,0.2);
                    border-top: 4px solid #00ffff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
                <p style="color: white; margin-top: 20px; font-family: Arial; text-align: center;">
                    Carregando...
                </p>
            `;
            overlay.appendChild(spinner);
            document.body.appendChild(overlay);
        }

        // Mostra overlay
        overlay.style.pointerEvents = 'all';
        overlay.style.opacity = '1';

        // Executa callback após delay
        setTimeout(() => {
            if (callback) callback();
        }, 500);
    }

    /**
     * Esconde efeito de transição
     */
    static hideTransition() {
        const overlay = document.getElementById('scene-transition');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.pointerEvents = 'none';
            }, 500);
        }
    }

    /**
     * Reinicia o jogo do início
     */
    static restartGame() {
        this.clearGameData();
        this.sceneHistory = [];
        this.loadScene('tutorial');
    }

    /**
     * Inicialização do SceneManager
     */
    static init() {
        console.log('Inicializando Scene Manager...');
        
        // Carrega estado anterior se existir
        this.loadState();
        
        // Detecta cena atual
        this.detectCurrentScene();
        
        // Esconde transição se estiver visível
        setTimeout(() => {
            this.hideTransition();
        }, 1000);

        // Event listeners globais
        this.setupGlobalEvents();
    }

    /**
     * Configura eventos globais
     */
    static setupGlobalEvents() {
        // Evento de erro global
        window.addEventListener('error', (event) => {
            console.error('Erro global capturado:', event.error);
        });

        // Salva estado antes de sair da página
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });

        // Teclas de atalho para desenvolvimento
        if (this.isDevelopment()) {
            document.addEventListener('keydown', (event) => {
                // Ctrl + número para mudar cenas rapidamente
                if (event.ctrlKey) {
                    switch (event.key) {
                        case '1':
                            event.preventDefault();
                            this.loadScene('tutorial');
                            break;
                        case '2':
                            event.preventDefault();
                            this.loadScene('level-select');
                            break;
                        case '3':
                            event.preventDefault();
                            this.loadScene('game');
                            break;
                        case '0':
                            event.preventDefault();
                            this.restartGame();
                            break;
                    }
                }
            });
        }
    }

    /**
     * Verifica se está em modo de desenvolvimento
     */
    static isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    /**
     * Obtém informações de debug
     */
    static getDebugInfo() {
        return {
            currentScene: this.currentScene,
            sceneHistory: this.sceneHistory,
            gameData: this.gameData,
            availableScenes: Object.keys(this.scenes)
        };
    }
}

// Auto-inicialização
document.addEventListener('DOMContentLoaded', () => {
    SceneManager.init();
});

// Exporta para usar em outros módulos
export { SceneManager };

// Exporta globalmente para debug
window.SceneManager = SceneManager;