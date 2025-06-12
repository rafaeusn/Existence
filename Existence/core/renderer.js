import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
export function createRenderer(canvasId) {
    const canvas = document.getElementById(canvasId);
    const renderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: true
    });
    
    renderer.setClearColor(0x11151c);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    return renderer;
}

export function setupResize(renderer, camera) {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}