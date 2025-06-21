import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { RGBELoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/RGBELoader.js';

export async function createEnvironment() {
    const hdrEquirect = await new RGBELoader()
        .setPath('https://miroleon.github.io/daily-assets/')
        .loadAsync('GRADIENT_01_01_comp.hdr');

    hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    return hdrEquirect;
}

export function createFog() {
    return new THREE.FogExp2(0x11151c, 0.45);
}
