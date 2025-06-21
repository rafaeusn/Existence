import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

export function createRenderer(canvasId) {
    const canvas = document.getElementById(canvasId);
    const renderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: true
    });

    renderer.setClearColor(0x000000);

    // Pixel Ratio para displays com maior densidade (exemplo: retina)
    renderer.setPixelRatio(window.devicePixelRatio);

    // Tamanho inicial
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Habilitar sombras suaves
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // (Opcional - para melhorar ainda mais a iluminação HDR e Bloom caso queira no futuro)
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    return renderer;
}

export function setupResize(renderer, camera) {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
