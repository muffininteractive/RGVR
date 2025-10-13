// Level Generator - RGVR
// Gerador de níveis baseado no JSON de objetos

class LevelGenerator {
    static objectsData = null;
    static currentLevel = null;

    /**
     * Carrega dados dos objetos do JSON
     */
    static async loadObjectsData() {
        if (this.objectsData) return this.objectsData;

        try {
            const response = await fetch('../data/objects.json');
            this.objectsData = await response.json();
            console.log('Objects data loaded:', this.objectsData);
            return this.objectsData;
        } catch (error) {
            console.error('Erro ao carregar dados dos objetos:', error);
            return null;
        }
    }

    /**
     * Gera um nível baseado na dificuldade
     * @param {string} difficulty - Dificuldade do nível (easy, medium, hard, expert)
     * @returns {Object} Configuração do nível gerado
     */
    static async generateLevel(difficulty = 'easy') {
        await this.loadObjectsData();

        if (!this.objectsData) {
            console.error('Dados dos objetos não carregados');
            return null;
        }

        const levelConfig = this.objectsData.levels[difficulty];
        if (!levelConfig) {
            console.error(`Dificuldade '${difficulty}' não encontrada`);
            return null;
        }

        console.log(`Gerando nível: ${difficulty}`, levelConfig);

        // Seleciona objetos para o nível
        const selectedObjects = this.selectObjectsForLevel(levelConfig.objectCount);

        if (!selectedObjects || selectedObjects.length === 0) {
            console.error('Falha ao selecionar objetos para o nível');
            return null;
        }

        // Escolhe objeto inicial e final
        const { startObject, endObject } = this.selectStartAndEndObjects(selectedObjects);

        if (!startObject || !endObject) {
            console.error('Falha ao selecionar objetos de início/fim');
            return null;
        }

        // Gera posições para os objetos
        const objectPlacements = this.generateObjectPlacements(selectedObjects);

        // Cria as conexões válidas entre objetos
        const validConnections = this.generateValidConnections(selectedObjects);

        const level = {
            difficulty,
            config: levelConfig,
            objects: selectedObjects,
            startObject,
            endObject,
            placements: objectPlacements,
            connections: validConnections,
            animations: this.objectsData.animations
        };

        this.currentLevel = level;
        console.log('Nível gerado:', level);

        return level;
    }

    /**
     * Seleciona objetos aleatórios para o nível
     * @param {number} count - Quantidade de objetos
     * @returns {Array} Lista de objetos selecionados
     */
    static selectObjectsForLevel(count) {
        const allObjects = [...this.objectsData.objects];
        const selected = [];

        // Embaralha array de objetos
        this.shuffleArray(allObjects);

        // Seleciona objetos garantindo que pelo menos um pode ser start e um pode ser end
        let hasStart = false;
        let hasEnd = false;

        for (const obj of allObjects) {
            if (selected.length >= count) break;

            // Prioriza objetos que podem ser start/end se ainda precisamos
            if (!hasStart && obj.start) {
                selected.push(obj);
                hasStart = true;
                continue;
            }

            if (!hasEnd && obj.end) {
                selected.push(obj);
                hasEnd = true;
                continue;
            }

            // Adiciona objetos normalmente
            if (selected.length < count) {
                selected.push(obj);
                if (obj.start) hasStart = true;
                if (obj.end) hasEnd = true;
            }
        }

        // Garante que temos pelo menos um start e um end
        if (!hasStart) {
            const startObjects = allObjects.filter(obj => obj.start);
            if (startObjects.length > 0) {
                selected[0] = startObjects[0];
            }
        }

        if (!hasEnd) {
            const endObjects = allObjects.filter(obj => obj.end);
            if (endObjects.length > 0) {
                selected[selected.length - 1] = endObjects[0];
            }
        }

        return selected.slice(0, count);
    }

    /**
     * Seleciona objetos de início e fim
     * @param {Array} objects - Lista de objetos disponíveis
     * @returns {Object} Objetos de início e fim
     */
    static selectStartAndEndObjects(objects) {
        const startCandidates = objects.filter(obj => obj.start);
        const endCandidates = objects.filter(obj => obj.end);

        if (startCandidates.length === 0) {
            console.error('Nenhum objeto com start:true encontrado!');
            return { startObject: objects[0], endObject: objects[objects.length - 1] };
        }

        if (endCandidates.length === 0) {
            console.error('Nenhum objeto com end:true encontrado!');
            return { startObject: objects[0], endObject: objects[objects.length - 1] };
        }

        const startObject = startCandidates[Math.floor(Math.random() * startCandidates.length)];
        const endObject = endCandidates[Math.floor(Math.random() * endCandidates.length)];

        return { startObject, endObject };
    }

    /**
     * Gera posições para os objetos na cena
     * @param {Array} objects - Lista de objetos
     * @returns {Object} Mapeamento de ID para posição
     */
    static generateObjectPlacements(objects) {
        const placements = {};
        const usedPositions = [];
        const minDistance = 2.5; // Distância mínima entre objetos

        // Área de posicionamento
        const area = {
            x: { min: -8, max: 8 },
            y: { min: 0.5, max: 3 },
            z: { min: -10, max: -2 }
        };

        objects.forEach((obj, index) => {
            let position;
            let attempts = 0;
            const maxAttempts = 50;

            do {
                position = {
                    x: Math.random() * (area.x.max - area.x.min) + area.x.min,
                    y: Math.random() * (area.y.max - area.y.min) + area.y.min,
                    z: Math.random() * (area.z.max - area.z.min) + area.z.min
                };
                attempts++;
            } while (this.isTooClose(position, usedPositions, minDistance) && attempts < maxAttempts);

            // Se não conseguiu encontrar posição válida, usa posição em grid
            if (attempts >= maxAttempts) {
                position = this.getGridPosition(index, objects.length);
            }

            placements[obj.id] = position;
            usedPositions.push(position);
        });

        return placements;
    }

    /**
     * Verifica se uma posição está muito próxima de outras
     * @param {Object} position - Posição a verificar
     * @param {Array} usedPositions - Posições já usadas
     * @param {number} minDistance - Distância mínima
     * @returns {boolean} True se está muito próximo
     */
    static isTooClose(position, usedPositions, minDistance) {
        return usedPositions.some(used => {
            const distance = Math.sqrt(
                Math.pow(position.x - used.x, 2) +
                Math.pow(position.y - used.y, 2) +
                Math.pow(position.z - used.z, 2)
            );
            return distance < minDistance;
        });
    }

    /**
     * Gera posição em grid como fallback
     * @param {number} index - Índice do objeto
     * @param {number} total - Total de objetos
     * @returns {Object} Posição em grid
     */
    static getGridPosition(index, total) {
        const cols = Math.ceil(Math.sqrt(total));
        const row = Math.floor(index / cols);
        const col = index % cols;

        return {
            x: (col - cols / 2) * 3,
            y: 1 + Math.random() * 0.5,
            z: -6 + row * 2
        };
    }

    /**
     * Gera conexões válidas entre objetos
     * @param {Array} objects - Lista de objetos
     * @returns {Object} Mapeamento de conexões válidas
     */
    static generateValidConnections(objects) {
        const connections = {};

        objects.forEach(obj => {
            connections[obj.id] = {
                canConnectTo: [],
                canReceiveFrom: []
            };

            // Verifica quais objetos este pode conectar (out)
            obj.out.forEach(outId => {
                const targetObj = objects.find(o => o.id === outId);
                if (targetObj) {
                    connections[obj.id].canConnectTo.push(outId);
                }
            });

            // Verifica quais objetos podem conectar a este (in)
            obj.in.forEach(inId => {
                const sourceObj = objects.find(o => o.id === inId);
                if (sourceObj) {
                    connections[obj.id].canReceiveFrom.push(inId);
                }
            });
        });

        return connections;
    }

    /**
     * Embaralha um array (Fisher-Yates shuffle)
     * @param {Array} array - Array para embaralhar
     */
    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Verifica se duas objetos podem se conectar
     * @param {string} fromId - ID do objeto origem
     * @param {string} toId - ID do objeto destino
     * @returns {boolean} True se podem se conectar
     */
    static canConnect(fromId, toId) {
        if (!this.currentLevel) return false;

        const connections = this.currentLevel.connections;
        return connections[fromId] && connections[fromId].canConnectTo.includes(toId);
    }

    /**
     * Encontra um caminho válido do start ao end
     * @returns {Array|null} Caminho válido ou null se não existir
     */
    static findValidPath() {
        if (!this.currentLevel) return null;

        const { startObject, endObject, connections } = this.currentLevel;
        const visited = new Set();
        const path = [];

        const dfs = (currentId, targetId) => {
            if (currentId === targetId) {
                path.push(currentId);
                return true;
            }

            if (visited.has(currentId)) return false;
            visited.add(currentId);
            path.push(currentId);

            const currentConnections = connections[currentId];
            if (currentConnections) {
                for (const nextId of currentConnections.canConnectTo) {
                    if (dfs(nextId, targetId)) {
                        return true;
                    }
                }
            }

            // Backtrack
            path.pop();
            return false;
        };

        const pathExists = dfs(startObject.id, endObject.id);
        return pathExists ? path : null;
    }

    /**
     * Obtém dicas para o jogador
     * @returns {Array} Lista de dicas
     */
    static getHints() {
        if (!this.currentLevel) return [];

        const hints = [];
        const { startObject, endObject } = this.currentLevel;

        hints.push(`Comece pelo objeto: ${startObject.name}`);
        hints.push(`Termine no objeto: ${endObject.name}`);

        const validPath = this.findValidPath();
        if (validPath && validPath.length > 2) {
            const secondObject = this.currentLevel.objects.find(obj => obj.id === validPath[1]);
            if (secondObject) {
                hints.push(`Próximo passo: conecte ao ${secondObject.name}`);
            }
        }

        return hints;
    }

    /**
     * Obtém estatísticas do nível atual
     * @returns {Object} Estatísticas do nível
     */
    static getLevelStats() {
        if (!this.currentLevel) return null;

        const validPath = this.findValidPath();
        const totalConnections = Object.values(this.currentLevel.connections)
            .reduce((total, conn) => total + conn.canConnectTo.length, 0);

        return {
            difficulty: this.currentLevel.difficulty,
            objectCount: this.currentLevel.objects.length,
            minimumSteps: validPath ? validPath.length - 1 : 0,
            totalPossibleConnections: totalConnections,
            hasValidSolution: validPath !== null
        };
    }
}

// Exporta para usar em outros módulos
export { LevelGenerator };

// Exporta globalmente para debug
window.LevelGenerator = LevelGenerator;