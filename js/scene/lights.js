/**
 * lights.js - Dramatic lighting setup for miniature diorama effect
 * Enhanced for "Night of the Mini Dead" aesthetic
 */

function createLighting(scene) {
    // Balanced ambient for initial visibility
    const ambientLight = new THREE.AmbientLight(0x6a6a8a, 0.4);
    scene.add(ambientLight);

    // Main dramatic key light - warm theatrical spotlight
    const sunLight = new THREE.DirectionalLight(0xffdd99, 1.8);
    sunLight.position.set(8, 10, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(4096, 4096);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.camera.left = -10;
    sunLight.shadow.camera.right = 10;
    sunLight.shadow.camera.top = 10;
    sunLight.shadow.camera.bottom = -10;
    sunLight.shadow.bias = -0.0002;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    // Cool moonlight fill from opposite side
    const fillLight = new THREE.DirectionalLight(0x8899ff, 0.6);
    fillLight.position.set(-8, 3, -5);
    scene.add(fillLight);

    // Dramatic rim light for miniature pop
    const rimLight = new THREE.DirectionalLight(0xff88ff, 0.8);
    rimLight.position.set(0, 8, -12);
    scene.add(rimLight);

    // Subtle underlight for added depth
    const underLight = new THREE.DirectionalLight(0x00ff88, 0.2);
    underLight.position.set(0, -10, 0);
    scene.add(underLight);

    return { sunLight, fillLight, rimLight, underLight };
}