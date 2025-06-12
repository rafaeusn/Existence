import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';
export function createComposer(renderer, scene, camera) {
    const composer = new EffectComposer(renderer);
    
    // Passes comuns a várias cenas
    composer.addPass(new RenderPass(scene, camera));
    
    const afterimagePass = new AfterimagePass();
    afterimagePass.uniforms.damp.value = 0.85;
    composer.addPass(afterimagePass);
    
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.35,  // strength
        0.1,   // threshold
        1      // radius
    );
    composer.addPass(bloomPass);
    
    return composer;
}