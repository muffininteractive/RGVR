// Torus Component - RGVR

AFRAME.registerComponent('torus-component', {
    dependencies: ['game-object'],
    
    init: function() {
        this.setupTorus();
    },

    setupTorus: function() {
        const objectData = JSON.parse(this.el.getAttribute('game-object').objectData);
        const props = objectData.properties;
        
        // Configura geometria do torus
        this.el.setAttribute('geometry', {
            primitive: 'torus',
            radius: props?.radius || 1,
            radiusTubular: props?.radiusTubular || 0.2
        });
        
        // Adiciona detalhes visuais específicos do torus
        this.addOrbitalRings();
    },

    addOrbitalRings: function() {
        // Cria anéis orbitais ao redor do torus
        const ring1 = document.createElement('a-torus');
        ring1.setAttribute('position', '0 0 0');
        ring1.setAttribute('rotation', '90 0 0');
        ring1.setAttribute('radius', 1.3);
        ring1.setAttribute('radius-tubular', 0.02);
        ring1.setAttribute('material', {
            color: '#ff00ff',
            opacity: 0.6,
            transparent: true
        });
        ring1.setAttribute('animation', {
            property: 'rotation',
            to: '90 360 0',
            dur: 5000,
            loop: true
        });
        
        const ring2 = document.createElement('a-torus');
        ring2.setAttribute('position', '0 0 0');
        ring2.setAttribute('rotation', '0 0 90');
        ring2.setAttribute('radius', 1.5);
        ring2.setAttribute('radius-tubular', 0.02);
        ring2.setAttribute('material', {
            color: '#00ff00',
            opacity: 0.4,
            transparent: true
        });
        ring2.setAttribute('animation', {
            property: 'rotation',
            to: '0 0 450',
            dur: 7000,
            loop: true
        });
        
        this.el.appendChild(ring1);
        this.el.appendChild(ring2);
    }
});

console.log('Torus component loaded');