/**
 * lights.js - Lighting setup for the Emotion Weather scene.
 * Creates a studio-like three-point lighting environment.
 */

function createLighting(scene) {
    // Ambient light provides a base illumination for the entire scene.
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // The main "sun" light, acting as the key light.
    // It's warmer (fff5e6) and is the primary source of light and shadows.
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    sunLight.position.set(5, 5, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 20;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

    // A cooler fill light from the opposite side to soften shadows.
    const fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.7);
    fillLight.position.set(-10, 5, 5);
    scene.add(fillLight);

    // A backlight to create a rim-lighting effect, separating the Earth from the background.
    const backLight = new THREE.DirectionalLight(0xffe6d5, 1.0);
    backLight.position.set(0, 5, -10);
    scene.add(backLight);

    return { sunLight, fillLight, backLight };
}