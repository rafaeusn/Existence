import { RGBELoader  } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/RGBELoader.js';
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

export async function createEnvironment() {
    const hdrEquirect = await new RGBELoader()
        .setPath('https://miroleon.github.io/daily-assets/')
        .loadAsync('gradient.hdr');
    
    hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    return hdrEquirect;
}

export function createFog() {
    return new THREE.FogExp2(0x11151c, 0.015);
}