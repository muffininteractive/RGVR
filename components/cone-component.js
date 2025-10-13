// Cone Component - RGVR

AFRAME.registerComponent('cone-component', {
    dependencies: ['game-object'],

    init: function () {
        this.setupCone();
    },

    setupCone: function () {
        const objectData = JSON.parse(this.el.getAttribute('game-object').objectData);
        const props = objectData.properties;

        // Configura geometria do cone
        this.el.setAttribute('geometry', {
            primitive: 'cone',
            radiusBottom: props?.radiusBottom || 0.8,
            radiusTop: props?.radiusTop || 0.1,
            height: props?.height || 2
        });

        // Adiciona detalhes visuais específicos do cone
        this.addSpiral();
    },

    addSpiral: function () {
        const objectData = JSON.parse(this.el.getAttribute('game-object').objectData);
        const height = objectData.properties?.height || 2;

        // Cria espiral ao redor do cone
        const spiralPoints = [];
        const segments = 20;

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 4; // 2 voltas
            const y = (t - 0.5) * height;
            const radius = 0.9 - t * 0.7; // Diminui conforme sobe

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            spiralPoints.push(new THREE.Vector3(x, y, z));
        }

        // Cria esferas pequenas na espiral
        spiralPoints.forEach((point, index) => {
            const sphere = document.createElement('a-sphere');
            sphere.setAttribute('position', `${point.x} ${point.y} ${point.z}`);
            sphere.setAttribute('radius', 0.03);
            sphere.setAttribute('color', '#00ff00');
            sphere.setAttribute('material', 'emissive: #00ff00; emissiveIntensity: 0.3');
            sphere.setAttribute('animation', {
                property: 'material.emissiveIntensity',
                to: 0.8,
                dur: 1000 + index * 100,
                dir: 'alternate',
                loop: true
            });

            this.el.appendChild(sphere);
        });
    }
});

console.log('Cone component loaded');