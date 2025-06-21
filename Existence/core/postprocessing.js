import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js';
import { PixelShader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/shaders/PixelShader.js';

export function createComposer(renderer, scene, camera) {
    const composer = new EffectComposer(renderer);

    // Render da cena
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Afterimage (efeito de arrasto de movimento)
    const afterimagePass = new AfterimagePass();
    afterimagePass.uniforms['damp'].value = 0.85;
    composer.addPass(afterimagePass);

    // Bloom (brilho exagerado)
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.35,  // strength
        0.1,   // threshold
        1      // radius
    );
    composer.addPass(bloomPass);

    // Pixelation (pixel shader)
    const pixelPass = new ShaderPass(PixelShader);
    pixelPass.uniforms['resolution'].value = new THREE.Vector2(window.innerWidth, window.innerHeight);
    pixelPass.uniforms['resolution'].value.multiplyScalar(window.devicePixelRatio);
    pixelPass.uniforms['pixelSize'].value = 1;
    composer.addPass(pixelPass);

    return composer;
}
