/**
 * world.js - Manages the creation of all world-related objects
 * V5.0 - Enhanced cloud fading system for diorama effect
 */

const worldObjects = {
    earth: null,
    cloudMesh: null,
    earthGroup: null,
    testObjects: []
};

async function createWorld(scene, renderer, loadingManager) {
    worldObjects.earthGroup = new THREE.Group();
    scene.add(worldObjects.earthGroup);

    createEarth(renderer, loadingManager);
    createStars(scene);
    createDepthTestObjects(scene);

    return worldObjects;
}

function createEarth(renderer, loadingManager) {
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const anisotropy = renderer.capabilities.getMaxAnisotropy();

    const dayTexture = textureLoader.load('assets/textures/2k_earth_day.jpg');
    const normalTexture = textureLoader.load('assets/textures/2k_earth_normal_map.jpg');
    const roughnessTexture = textureLoader.load('assets/textures/2k_earth_specular_map.jpg');
    const cloudTexture = textureLoader.load('assets/textures/2k_earth_clouds.jpg');
    const displacementTexture = textureLoader.load('assets/textures/2k_earth_height.jpg');

    [dayTexture, normalTexture, roughnessTexture, cloudTexture, displacementTexture].forEach(t => {
        t.anisotropy = anisotropy;
        t.wrapS = THREE.RepeatWrapping;
    });
    dayTexture.encoding = THREE.sRGBEncoding;

    // --- EARTH MATERIAL ---
    const earthMaterial = new THREE.MeshStandardMaterial({
        map: dayTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(CONFIG.earth.normalScale, CONFIG.earth.normalScale),
        roughnessMap: roughnessTexture,
        roughness: 0.7,
        metalness: 0.1,
    });

    earthMaterial.onBeforeCompile = (shader) => {
        console.log("Compiling custom EARTH shader...");
        shader.uniforms.uDisplacementMap = { value: displacementTexture };
        shader.uniforms.uDisplacementScale = { value: CONFIG.earth.displacementScale };
        shader.uniforms.uOceanShine = { value: CONFIG.earth.oceanShine };

        // Inject uniforms
        const commonInjection = `
            #include <common>
            uniform sampler2D uDisplacementMap;
            uniform float uDisplacementScale;
            uniform float uOceanShine;
        `;

        shader.vertexShader = shader.vertexShader.replace('#include <common>', commonInjection);
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', commonInjection);

        // Inject vertex displacement logic
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            float displacement = texture2D(uDisplacementMap, uv).r;
            transformed += normalize(normal) * displacement * uDisplacementScale;
            `
        );

        // Inject fragment ocean shine logic
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <roughnessmap_fragment>',
            `
            float roughnessFactor = roughness;
            #ifdef USE_ROUGHNESSMAP
                vec4 texelRoughness = texture2D( roughnessMap, vUv );
                // Standard roughness from map
                roughnessFactor *= texelRoughness.g;
                // Inverse of roughness map gives us the ocean mask
                float ocean = 1.0 - texelRoughness.g; 
                float oceanShineFactor = uOceanShine * ocean;
                // Reduce roughness for shiny oceans
                roughnessFactor *= (1.0 - oceanShineFactor);
            #endif
            `
        );
        earthMaterial.userData.shader = shader;
    };

    const earthGeometry = new THREE.SphereGeometry(CONFIG.earth.radius, CONFIG.earth.segments, CONFIG.earth.segments);
    worldObjects.earth = new THREE.Mesh(earthGeometry, earthMaterial);
    worldObjects.earth.rotation.y = Math.PI;
    worldObjects.earth.receiveShadow = true;
    worldObjects.earth.castShadow = true;
    worldObjects.earth.renderOrder = 0;  // Render earth first
    worldObjects.earthGroup.add(worldObjects.earth);

    // --- DYNAMIC CLOUD LAYER (Enhanced for diorama effect) ---
    const cloudMaterial = new THREE.MeshStandardMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: CONFIG.clouds.opacity,
        blending: THREE.NormalBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        // No emissive to avoid color pollution
        roughness: 1.0,  // Matte clouds for diorama style
        metalness: 0.0   // Non-metallic
    });

    cloudMaterial.onBeforeCompile = (shader) => {
        console.log('Compiling enhanced CLOUD shader...');
        shader.uniforms.uDisplacementMap = { value: displacementTexture };
        shader.uniforms.uCloudAltitude = { value: CONFIG.clouds.altitude };
        shader.uniforms.uCloudMinHeight = { value: CONFIG.clouds.minHeight };
        shader.uniforms.uCloudMaxHeight = { value: CONFIG.clouds.maxHeight };
        shader.uniforms.uCloudFadePower = { value: CONFIG.clouds.fadePower };

        // Inject uniforms
        const cloudCommonInjection = `
            #include <common>
            uniform sampler2D uDisplacementMap;
            uniform float uCloudAltitude;
            uniform float uCloudMinHeight;
            uniform float uCloudMaxHeight;
            uniform float uCloudFadePower;
            
            varying float vDisplacement;
        `;
        shader.vertexShader = shader.vertexShader.replace('#include <common>', cloudCommonInjection);
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', cloudCommonInjection);

        // Pass displacement to fragment shader
        shader.vertexShader = shader.vertexShader.replace(
            '#include <worldpos_vertex>',
            `
            vDisplacement = texture2D(uDisplacementMap, uv).r;
            #include <worldpos_vertex>
            `
        );

        // Enhanced fade logic for diorama effect
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <output_fragment>',
            `
            #include <output_fragment>
            
            // Sophisticated height-based fade
            float heightFade = 1.0;
            
            // Fade out clouds where terrain is high
            if (vDisplacement > uCloudMinHeight) {
                float fadeRange = uCloudMaxHeight - uCloudMinHeight;
                float fadeProgress = (vDisplacement - uCloudMinHeight) / fadeRange;
                fadeProgress = clamp(fadeProgress, 0.0, 1.0);
                
                // Non-linear fade for more artistic control
                heightFade = 1.0 - pow(fadeProgress, uCloudFadePower);
                
                // Add slight noise to break up hard edges
                float noise = fract(sin(dot(vUv * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
                heightFade -= noise * 0.1 * fadeProgress;
                heightFade = clamp(heightFade, 0.0, 1.0);
            }
            
            // Apply the fade
            gl_FragColor.a *= heightFade;
            
            // Extra fade at sphere edges for softer look
            vec2 center = vUv - 0.5;
            float edgeFade = 1.0 - smoothstep(0.45, 0.5, length(center));
            gl_FragColor.a *= edgeFade;
            
            // Ensure clouds are purely white/grey (no color tinting)
            vec3 cloudColor = gl_FragColor.rgb;
            float cloudGray = dot(cloudColor, vec3(0.299, 0.587, 0.114));
            gl_FragColor.rgb = vec3(cloudGray);
            `
        );
        cloudMaterial.userData.shader = shader;
    };

    worldObjects.cloudMesh = new THREE.Mesh(
        new THREE.SphereGeometry(
            CONFIG.earth.radius + CONFIG.clouds.altitude,
            CONFIG.earth.segments,
            CONFIG.earth.segments
        ),
        cloudMaterial
    );
    // Clouds don't cast shadows in diorama style - keeps it clean
    worldObjects.cloudMesh.castShadow = false;
    worldObjects.cloudMesh.receiveShadow = false;
    // Render clouds after earth to avoid blending issues
    worldObjects.cloudMesh.renderOrder = 1;
    worldObjects.earthGroup.add(worldObjects.cloudMesh);

    // --- ATMOSPHERE ---
    const atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
            'c': { value: 0.3 },
            'p': { value: 5.0 },
            'glowColor': { value: new THREE.Vector3(0.6, 0.3, 1.0) }
        },
        vertexShader: `
            varying vec3 vNormal; 
            void main() { 
                vNormal = normalize(normalMatrix * normal); 
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
            }`,
        fragmentShader: `
            uniform float c; 
            uniform float p; 
            uniform vec3 glowColor; 
            varying vec3 vNormal; 
            void main() { 
                float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p); 
                gl_FragColor = vec4(glowColor, 1.0) * intensity; 
            }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(CONFIG.earth.radius * 1.08, CONFIG.earth.segments, CONFIG.earth.segments),
        atmosphereMaterial
    );
    worldObjects.earthGroup.add(atmosphere);
}

function createStars(scene) {
    const starCount = 15000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        const radius = 150 + Math.random() * 350;
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);

        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);

        const colorTemp = Math.random();
        if (colorTemp < 0.2) {
            colors[i3] = 0.8; colors[i3 + 1] = 0.5; colors[i3 + 2] = 1.0;
        } else if (colorTemp < 0.4) {
            colors[i3] = 0.5; colors[i3 + 1] = 1.0; colors[i3 + 2] = 0.6;
        } else if (colorTemp < 0.7) {
            colors[i3] = 1.0; colors[i3 + 1] = 1.0; colors[i3 + 2] = 1.0;
        } else {
            colors[i3] = 1.0; colors[i3 + 1] = 0.6; colors[i3 + 2] = 0.3;
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.7,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
    });

    scene.add(new THREE.Points(geometry, material));
}

function createDepthTestObjects(scene) {
    const objectsData = [
        { pos: [-3, 1, 4], size: 0.5, color: 0xff0066, emissive: 0x660033 },
        { pos: [3.5, 0, 0], size: 0.4, color: 0xffff00, emissive: 0x666600 },
        { pos: [0, -2, -5], size: 0.6, color: 0x00ff88, emissive: 0x006644 },
        { pos: [-2, 3, -10], size: 0.8, color: 0x8800ff, emissive: 0x440088 }
    ];

    objectsData.forEach(obj => {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(obj.size, 32, 32),
            new THREE.MeshPhongMaterial({
                color: obj.color,
                emissive: obj.emissive,
                shininess: 150,
                specular: 0xffffff
            })
        );
        sphere.position.set(...obj.pos);
        sphere.visible = false;
        sphere.castShadow = true;
        scene.add(sphere);
        worldObjects.testObjects.push({ mesh: sphere });
    });
}