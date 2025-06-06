/**
 * Emotion Weather - Miniature Diorama Earth Visualization
 * V4.3 - Fixed DOF parameters for visible tilt-shift effect
 */

// --- GLOBALS & CONFIG ---
let scene, camera, renderer, clock, postProcessing, focusController, globeController;
let world;

const CONFIG = {
    earth: {
        radius: 2.5,
        segments: 256,
        normalScale: 1.0,
        displacementScale: 0.1,
        oceanShine: 0.5,
    },
    camera: {
        fov: 35,
        near: 0.1,
        far: 1000,
        basePosition: { x: 0, y: 3, z: 8 }
    },
    animation: {
        autoRotate: true,
        rotationSpeed: 0.00015,
        cloudRotationSpeed: 0.00030,
        wobbleSpeed: 0.0008,
        wobbleAmount: 0.01,
        dragSensitivity: 0.09
    },
    postProcessing: {
        focus: 6.5,
        aperture: 2.0,      // FIXED: Smaller values = stronger blur (like f-stop)
        maxblur: 0.02,      // FIXED: Increased for more visible effect
        saturation: 1.3,
        brightness: 1.0,
    }
};

const DEBUG_STATE = {
    showTestObjects: false,
    logFrameInfo: false,
};

// --- INTERACTION CONTROLLERS ---

class GlobeInteractionController {
    constructor(camera, earthGroup, renderer) {
        this.camera = camera;
        this.earthGroup = earthGroup;
        this.renderer = renderer;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.previousMouse = new THREE.Vector2();
        this.isDragging = false;
        this.rotationVelocity = 0;
        this.rotationDamping = 0.99;
        this.momentumThreshold = 0.0001;
        this.setupEvents();
    }

    setupEvents() {
        const canvas = this.renderer.domElement;
        const onDown = (e) => this.onMouseDown(e.type.startsWith('touch') ? e.touches[0] : e);
        const onMove = (e) => this.onMouseMove(e.type.startsWith('touch') ? e.touches[0] : e);
        const onUp = () => this.onMouseUp();

        canvas.addEventListener('mousedown', onDown);
        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mouseup', onUp);
        canvas.addEventListener('mouseleave', onUp);

        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e); }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
        canvas.addEventListener('touchend', onUp);
        canvas.addEventListener('touchcancel', onUp);
    }

    updateMousePosition(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    checkHover() {
        if (this.isDragging || !world.earth) return;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(world.earth, true);
        document.getElementById('canvas-container').style.cursor = intersects.length > 0 ? 'grab' : 'default';
    }

    onMouseDown(event) {
        if (!world.earth) return;
        this.updateMousePosition(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.raycaster.intersectObject(world.earth, true).length > 0) {
            this.isDragging = true;
            this.rotationVelocity = 0;
            document.getElementById('canvas-container').style.cursor = 'grabbing';
            CONFIG.animation.autoRotate = false;
            window.dispatchEvent(new CustomEvent('autoRotationChange', { detail: { value: false } }));
            this.previousMouse.copy(this.mouse);
        }
    }

    onMouseMove(event) {
        this.updateMousePosition(event);
        this.checkHover();

        if (this.isDragging) {
            const deltaX = this.mouse.x - this.previousMouse.x;
            const rotationDelta = deltaX * Math.PI * CONFIG.animation.dragSensitivity;
            this.earthGroup.rotation.y += rotationDelta;
            this.rotationVelocity = this.rotationVelocity * 0.2 + rotationDelta * 0.8;
            this.previousMouse.copy(this.mouse);
        }
    }

    onMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            document.getElementById('canvas-container').style.cursor = 'grab';
        }
    }

    update() {
        if (!this.earthGroup) return;

        if (!this.isDragging && Math.abs(this.rotationVelocity) > this.momentumThreshold) {
            this.earthGroup.rotation.y += this.rotationVelocity;
            this.rotationVelocity *= this.rotationDamping;

            if (Math.abs(this.rotationVelocity) < this.momentumThreshold) {
                this.rotationVelocity = 0;
                setTimeout(() => {
                    if (!this.isDragging) {
                        CONFIG.animation.autoRotate = true;
                        window.dispatchEvent(new CustomEvent('autoRotationChange', { detail: { value: true } }));
                    }
                }, 2000);
            }
        }

        if (CONFIG.animation.autoRotate && !this.isDragging) {
            this.earthGroup.rotation.y += CONFIG.animation.rotationSpeed;
        }

        const time = clock.getElapsedTime();
        this.earthGroup.rotation.z = Math.sin(time * CONFIG.animation.wobbleSpeed * Math.PI) * CONFIG.animation.wobbleAmount;
    }
}

class FocusController {
    constructor(camera) {
        this.camera = camera;
        this.mouse = new THREE.Vector2(0, 0);
        this.currentFocus = CONFIG.postProcessing.focus;
        this.enabled = false;
    }

    onMouseMove(event) {
        if (!this.enabled) return;
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    update() {
        if (!this.enabled || !postProcessing) return;
        const targetFocus = camera.position.z + (this.mouse.y * 3);
        this.currentFocus = THREE.MathUtils.lerp(this.currentFocus, targetFocus, 0.1);
        postProcessing.updateFocus(this.currentFocus);
    }
}

// --- MAIN INITIALIZATION ---
async function init() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020308, 0.08);

    camera = new THREE.PerspectiveCamera(
        CONFIG.camera.fov,
        window.innerWidth / window.innerHeight,
        CONFIG.camera.near,
        CONFIG.camera.far
    );
    camera.position.set(CONFIG.camera.basePosition.x, CONFIG.camera.basePosition.y, CONFIG.camera.basePosition.z);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        logarithmicDepthBuffer: false  // Important for BokehPass depth accuracy
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.autoClear = false;  // Important for post-processing
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onLoad = () => {
        console.log("All assets loaded, revealing the scene.");
        document.body.classList.add('loaded');
        globeController = new GlobeInteractionController(camera, world.earthGroup, renderer);
    };

    createLighting(scene);
    world = await createWorld(scene, renderer, loadingManager);

    try {
        postProcessing = new window.PostProcessing(renderer, scene, camera);
        postProcessing.setParameters(CONFIG.postProcessing);
    } catch (e) {
        console.error('Post-processing failed to initialize.', e);
        postProcessing = null;
        document.getElementById('status-dofmode').textContent = 'ERROR';
    }

    focusController = new FocusController(camera);

    resetParameters();
    setupEvents();
    animate();
}

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (globeController) globeController.update();
    if (world && world.cloudMesh) world.cloudMesh.rotation.y += CONFIG.animation.cloudRotationSpeed * delta * 10;
    if (focusController) focusController.update();

    if (DEBUG_STATE.logFrameInfo) {
        console.log(`Frame: ${renderer.info.render.frame}, Tris: ${renderer.info.render.triangles}, Calls: ${renderer.info.render.calls}`);
    }

    if (postProcessing) {
        postProcessing.render(delta);
    } else {
        renderer.render(scene, camera);
    }
}

// --- EVENT HANDLERS & DEBUG ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (postProcessing) postProcessing.onWindowResize();
}

function setupEvents() {
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', (e) => {
        if (focusController) focusController.onMouseMove(e);
    });
    setupDebugControls();
}

function setupDebugControls() {
    const debugParams = ['focus', 'aperture', 'maxblur', 'saturation', 'brightness', 'relief', 'displacement', 'oceanShine'];

    debugParams.forEach(param => {
        const slider = document.getElementById(param);
        const input = document.getElementById(param + '-input');
        if (!slider || !input) return;

        const updateValue = (value) => {
            updateDebugParameter(param, value);
        };

        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            input.value = value.toFixed(['maxblur', 'displacement', 'oceanShine'].includes(param) ? 3 : 2);
            updateValue(value);
        });

        input.addEventListener('change', (e) => {
            let value = parseFloat(e.target.value);
            if (isNaN(value)) return;
            slider.value = value;
            updateValue(value);
        });
    });

    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(e) {
    if (e.key === 'd' && e.ctrlKey) {
        e.preventDefault();
        document.body.classList.toggle('debug-mode');
        return;
    }

    if (!document.body.classList.contains('debug-mode')) return;

    const keyActions = {
        'r': resetParameters,
        'f': toggleAutoFocus,
        't': toggleTestObjects,
        'd': () => postProcessing && postProcessing.debugDOF(),
        's': logDetailedState,
        'l': toggleFrameLogging,
        'a': toggleAutoRotation,
        '1': () => focusOnObject(0),
        '2': focusOnEarth,
        '3': () => focusOnObject(3)
    };

    if (keyActions[e.key.toLowerCase()]) keyActions[e.key.toLowerCase()]();
}

function updateDebugParameter(param, value) {
    if (['relief', 'displacement', 'oceanShine'].includes(param)) {
        const key = param === 'relief' ? 'normalScale' : param === 'displacement' ? 'displacementScale' : 'oceanShine';
        CONFIG.earth[key] = value;

        if (world && world.earth && world.earth.material.userData.shader) {
            if (key === 'normalScale') {
                world.earth.material.normalScale.set(value, value);
            } else {
                const uniformName = key === 'displacementScale' ? 'uDisplacementScale' : 'uOceanShine';
                world.earth.material.userData.shader.uniforms[uniformName].value = value;
            }
        }
    } else {
        CONFIG.postProcessing[param] = value;
        if (postProcessing) postProcessing.setParameters({ [param]: value });
    }
}

function resetParameters() {
    // FIXED: Updated default values for Three.js r128 BokehPass
    const ppDefaults = {
        focus: 6.5,
        aperture: 2.5,      // Good starting value
        maxblur: 0.01,      // Smaller value for r128
        saturation: 1.3,
        brightness: 1.0
    };
    const earthDefaults = {
        relief: 1.0,
        displacement: 0.1,
        oceanShine: 0.5
    };
    const allDefaults = { ...ppDefaults, ...earthDefaults };

    Object.entries(allDefaults).forEach(([key, value]) => {
        updateDebugParameter(key, value);
        const slider = document.getElementById(key);
        const input = document.getElementById(key + '-input');
        if (slider) slider.value = value;
        if (input) input.value = value.toFixed(['maxblur', 'displacement', 'oceanShine'].includes(key) ? 3 : 2);
    });

    console.log('Parameters reset to defaults for Three.js r128');
}

function toggleAutoRotation() {
    if (!globeController) return;
    CONFIG.animation.autoRotate = !CONFIG.animation.autoRotate;
    window.dispatchEvent(new CustomEvent('autoRotationChange', { detail: { value: CONFIG.animation.autoRotate } }));
}

function toggleAutoFocus() {
    focusController.enabled = !focusController.enabled;
    updateDebugStatus('autofocus', focusController.enabled);
}

function toggleTestObjects() {
    DEBUG_STATE.showTestObjects = !DEBUG_STATE.showTestObjects;
    world.testObjects.forEach(obj => obj.mesh.visible = DEBUG_STATE.showTestObjects);
    updateDebugStatus('testobjects', DEBUG_STATE.showTestObjects);
}

function toggleFrameLogging() {
    DEBUG_STATE.logFrameInfo = !DEBUG_STATE.logFrameInfo;
    updateDebugStatus('framelog', DEBUG_STATE.logFrameInfo);
}

function focusOnObject(index) {
    if (world.testObjects[index]) {
        const distance = camera.position.distanceTo(world.testObjects[index].mesh.position);
        updateDebugParameter('focus', distance);
        document.getElementById('focus').value = distance;
        document.getElementById('focus-input').value = distance.toFixed(2);
    }
}

function focusOnEarth() {
    const dist = camera.position.distanceTo(world.earthGroup.position) - CONFIG.earth.radius;
    updateDebugParameter('focus', dist);
    document.getElementById('focus').value = dist;
    document.getElementById('focus-input').value = dist.toFixed(2);
}

function logDetailedState() {
    console.log('=== DETAILED STATE ===');
    console.log('CONFIG:', CONFIG);
    console.log('DEBUG:', DEBUG_STATE);
    console.log('Camera pos:', camera.position);
    console.log('Post-proc:', postProcessing ? postProcessing.params : 'N/A');

    if (world.earth) {
        console.log('Material:', {
            normalScale: world.earth.material.normalScale.x,
            displacementScale: world.earth.material.userData.shader?.uniforms.uDisplacementScale.value,
            roughness: world.earth.material.roughness,
            metalness: world.earth.material.metalness
        });
    }
}

function updateDebugStatus(key, value) {
    window.dispatchEvent(new CustomEvent('debugStateChange', { detail: { key, value } }));
}

window.addEventListener('DOMContentLoaded', init);