// Object Components - Componentes especializados para objetos específicos

import { levelState } from '../level-state.js';

/**
 * Cannon Activator Component
 * Quando atingido por uma vela, exibe partículas por 2s e dispara uma bola
 */
AFRAME.registerComponent('cannon-activator', {
    schema: {
        fired: { type: 'boolean', default: false }
    },

    init: function () {
        this._onCollide = this._onCollide.bind(this);
        this.el.addEventListener('collide', this._onCollide);
    },

    _onCollide: function (evt) {
        if (this.data.fired) return; // já disparado
        if (!levelState.physicsEnabled) return;

        const otherEl = evt.detail.body && evt.detail.body.el;
        if (!otherEl) return;

        // Aceita colisão com id 'candle' ou tipo cylinder com id candle
        const hitCandle = otherEl.id === 'candle' || otherEl.classList.contains('candle');
        if (!hitCandle) return;

        this.data.fired = true;
        console.log('🔥 Cannon activated by candle collision — starting particles');

        // Se a vela tem um emitter de particle-system (a chama), aguarde 2s e remova para não conflitar/sobrepor
        try {
            if (otherEl) {
                // agendar remoção após 2 segundos para permitir continuidade visual
                setTimeout(() => {
                    try {
                        const candleEmitters = Array.from(otherEl.querySelectorAll('[particle-system], .candle-emitter'));
                        candleEmitters.forEach(em => {
                            if (em.parentNode) em.parentNode.removeChild(em);
                        });
                    } catch (innerErr) {
                        console.warn('⚠️ Erro ao remover particle emitters do candle (delayed):', innerErr);
                    }
                }, 1000);
            }
        } catch (e) {
            console.warn('⚠️ Erro ao agendar remoção de particle emitters do candle:', e);
        }

        // Criar emitter de partículas na posição do canhão usando particle-system
        const scene = this.el.sceneEl || document.querySelector('a-scene');
        const cannonPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(cannonPos);

        const ps = document.createElement('a-entity');
        ps.setAttribute('position', `${cannonPos.x - 0.8} ${cannonPos.y + 1.4} ${cannonPos.z}`);
        // config compacto de particle-system: rajada curta, cores quentes
        const psAttr = `particleCount: 10; color: #ffcc00,#ff8800; size: 0.32; maxAge: 0.01; velocity: 0 1 0; spread: 1 1 1; acceleration: 0 1 0; duration: 1.8;`;
        ps.setAttribute('particle-system', psAttr);
        scene.appendChild(ps);

        // Remover partículas após ~2s e disparar
        setTimeout(() => {
            if (ps.parentNode) ps.parentNode.removeChild(ps);
            this._spawnAndFireBall();
        }, 2000);
    },

    _spawnAndFireBall: function () {
        const scene = this.el.sceneEl || document.querySelector('a-scene');
        // criar esfera na boca do canhão
        const ball = document.createElement('a-sphere');
        const worldPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(worldPos);

        // offset para frente do canhão — assume que o canhão aponta para -Z no espaço do modelo
        const forward = new THREE.Vector3(1, 1, 0);
        forward.applyQuaternion(this.el.object3D.getWorldQuaternion(new THREE.Quaternion()));
        const spawnPos = worldPos.clone().add(forward.clone().multiplyScalar(0.8)).add(new THREE.Vector3(0, 0, 0));

        ball.setAttribute('radius', 0.3);
        ball.setAttribute('position', `${spawnPos.x + 0.2} ${spawnPos.y + 0.8} ${spawnPos.z}`);
        ball.setAttribute('material', 'color: #666666; metalness: 0.7; roughness: 0.2');
        ball.setAttribute('shadow', 'cast: true; receive: false');

        // adicionar à cena e depois aplicar física dynamic-body
        scene.appendChild(ball);

        // Tentar adicionar um corpo dinâmico e aplicar impulso de forma resiliente e não-bloqueante
        // Alguns runtimes de XR não funcionam bem com requestAnimationFrame; preferir event-driven + retry com setTimeout
        try {
            // Adicionar configuração dynamic-body (CANNON) imediatamente
            ball.setAttribute('dynamic-body', { mass: 4, shape: 'sphere', sphereRadius: 0.3, linearDamping: 0.01, angularDamping: 0.01 });

            const applyImpulseToBody = (physicsBody) => {
                try {
                    if (!physicsBody) return false;
                    if (typeof CANNON === 'undefined') return false;

                    // Acordar o corpo (importante se o mundo/corpos estão dormindo em XR)
                    if (typeof physicsBody.wakeUp === 'function') {
                        physicsBody.wakeUp();
                    }

                    const impulse = forward.clone().multiplyScalar(25);
                    physicsBody.applyImpulse(new CANNON.Vec3(impulse.x + 20, impulse.y, 0), new CANNON.Vec3(0, 0, 0));

                    console.log('🔫 Impulse applied to spawned ball:', { impulse, hasBody: !!physicsBody });
                    return true;
                } catch (err) {
                    console.warn('⚠️ Error while applying impulse to physics body:', err);
                    return false;
                }
            };

            // Se o corpo já está disponível no elemento, tentar imediatamente
            const tryApplyNow = () => {
                const existingBody = ball.body || (ball.components && ball.components['dynamic-body'] && ball.components['dynamic-body'].body);
                if (existingBody && applyImpulseToBody(existingBody)) return true;
                return false;
            };

            if (tryApplyNow()) {
                // pronto
            } else {
                // Ouvir por 'body-loaded' que aframe-physics-system emite quando o corpo CANNON está pronto
                const onBodyLoaded = (evt) => {
                    const physicsBody = evt.detail && (evt.detail.body || evt.target.body) ? (evt.detail.body || evt.target.body) : (ball.body || (ball.components && ball.components['dynamic-body'] && ball.components['dynamic-body'].body));
                    if (applyImpulseToBody(physicsBody)) {
                        // limpar listener uma vez aplicado
                        ball.removeEventListener('body-loaded', onBodyLoaded);
                        ball.removeAttribute('animation');
                    }
                };

                ball.addEventListener('body-loaded', onBodyLoaded, { once: true });

                // Fallback retry usando setTimeout (não-bloqueante) com timeout total
                let attempts = 0;
                const maxAttempts = 12; // ~1.2s
                const retryDelay = 100;

                const retry = () => {
                    attempts++;
                    if (tryApplyNow()) {
                        ball.removeEventListener('body-loaded', onBodyLoaded);
                        ball.removeAttribute('animation');
                        return;
                    }
                    if (attempts >= maxAttempts) {
                        console.warn('⚠️ Could not apply impulse to ball within timeout. Body present?', !!(ball.body || (ball.components && ball.components['dynamic-body'] && ball.components['dynamic-body'].body)));
                        return;
                    }
                    setTimeout(retry, retryDelay);
                };

                setTimeout(retry, retryDelay);
            }
        } catch (e) {
            console.warn('⚠️ Error applying physics impulse to ball', e);
        }

        console.log('💥 Cannon fired ball');
    },

    remove: function () {
        this.el.removeEventListener('collide', this._onCollide);
    }
});

/**
 * Flame Animation Component
 * Anima a chama usando sprite sheet animado
 */
AFRAME.registerComponent('flame-anim', {
    schema: {
        cols: { type: 'int', default: 3 },
        rows: { type: 'int', default: 3 },
        fps: { type: 'int', default: 9 },
    },

    init: function () {
        this.frame = 0;
        this.lastTime = 0;
        this.totalFrames = this.data.cols * this.data.rows;
        this.material = this.el.getObject3D('mesh').material;
        this.material.blending = THREE.AdditiveBlending;
    },

    tick: function (time, timeDelta) {
        if (this.material.map && time - this.lastTime > 1000 / this.data.fps) {
            this.frame = (this.frame + 1) % this.totalFrames;
            let col = this.frame % this.data.cols;
            let row = Math.floor(this.frame / this.data.cols);
            this.material.map.offset.set(
                col / this.data.cols,
                1 - (row + 1) / this.data.rows
            );
            this.material.map.repeat.set(1 / this.data.cols, 1 / this.data.rows);
            this.lastTime = time;
        }
    }
});

export { };
