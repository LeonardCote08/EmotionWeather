/**
 * Post-processing module for Emotion Weather
 * FIXED for Three.js r128 BokehPass specific requirements
 */

const ColorGradeShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'saturation': { value: 1.3 },
        'vignette': { value: 0.4 },
        'brightness': { value: 1.0 },
        'contrast': { value: 1.1 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float saturation;
        uniform float vignette;
        uniform float brightness;
        uniform float contrast;
        varying vec2 vUv;
        
        vec3 adjustSaturation(vec3 color, float sat) {
            const vec3 W = vec3(0.299, 0.587, 0.114);
            return mix(vec3(dot(color, W)), color, sat);
        }
        
        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            vec3 color = texel.rgb;
            
            // Apply contrast
            color = (color - 0.5) * contrast + 0.5;
            
            // Apply brightness
            color *= brightness;
            
            // Apply saturation
            color = adjustSaturation(color, saturation);
            
            // Color temperature adjustment
            float luma = dot(color, vec3(0.299, 0.587, 0.114));
            vec3 warm = vec3(1.05, 1.0, 0.95);
            vec3 cool = vec3(0.95, 1.0, 1.05);
            color *= mix(cool, warm, luma);
            
            // Vignette effect
            vec2 center = vUv - 0.5;
            float dist = length(center * 1.2);
            float vig = smoothstep(0.8, 0.2, dist);
            color = mix(color * (1.0 - vignette), color, vig);
            
            gl_FragColor = vec4(clamp(color, 0.0, 1.0), texel.a);
        }`
};

class PostProcessing {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.params = {};
        this.useTiltShift = false; // Toggle between Bokeh and TiltShift

        console.log('PostProcessing constructor called');
        console.log('THREE.BokehPass exists?', typeof THREE.BokehPass !== 'undefined');
        console.log('THREE.BokehShader exists?', typeof THREE.BokehShader !== 'undefined');

        try {
            this.initComposer();
        } catch (e) {
            console.error('Fatal error initializing EffectComposer:', e);
            this.composer = null;
        }
    }

    initComposer() {
        console.log('Initializing composer...');
        this.composer = new THREE.EffectComposer(this.renderer);

        // Add depth texture to render target for BokehPass
        const renderTarget = this.composer.renderTarget1.clone();
        renderTarget.depthTexture = new THREE.DepthTexture();
        renderTarget.depthTexture.type = THREE.UnsignedShortType;
        renderTarget.depthTexture.format = THREE.DepthFormat;
        this.composer.renderTarget1 = renderTarget;
        this.composer.renderTarget2 = renderTarget.clone();

        // Render pass
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        console.log('RenderPass added');

        // Check if BokehPass exists
        if (typeof THREE.BokehPass === 'undefined') {
            console.error('THREE.BokehPass is not defined! Check if BokehShader.js and BokehPass.js are loaded correctly.');
            return;
        }

        // BokehPass with r128 specific configuration
        console.log('Creating BokehPass...');

        // CRITICAL FOR r128: Don't pass width/height in params
        this.bokehPass = new THREE.BokehPass(this.scene, this.camera, {
            focus: 6.5,
            aperture: 0.025,   // Direct value, no tiny scaling
            maxblur: 0.01      // Start with smaller value
        });

        console.log('BokehPass created');

        // CRITICAL: Set the uniforms that r128 expects
        if (this.bokehPass.uniforms) {
            // Set initial values directly
            this.bokehPass.uniforms["focus"].value = 6.5;
            this.bokehPass.uniforms["aperture"].value = 0.025;
            this.bokehPass.uniforms["maxblur"].value = 0.01;

            // CRITICAL for r128: Manually set aspect ratio
            this.bokehPass.uniforms["aspect"] = { value: this.camera.aspect };

            console.log('BokehPass uniforms initialized:', {
                focus: this.bokehPass.uniforms["focus"].value,
                aperture: this.bokehPass.uniforms["aperture"].value,
                maxblur: this.bokehPass.uniforms["maxblur"].value,
                aspect: this.bokehPass.uniforms["aspect"].value
            });
        }

        // For r128: Set needsSwap if needed
        this.bokehPass.needsSwap = true;

        this.composer.addPass(this.bokehPass);
        console.log('BokehPass added to composer');

        // Color grading pass
        this.colorGradePass = new THREE.ShaderPass(ColorGradeShader);
        this.composer.addPass(this.colorGradePass);

        // Copy pass to screen (IMPORTANT for r128)
        const copyPass = new THREE.ShaderPass(THREE.CopyShader);
        copyPass.renderToScreen = true;
        this.composer.addPass(copyPass);

        console.log('All passes added, composer ready');
    }

    setParameters(newParams) {
        Object.assign(this.params, newParams);

        if (!this.composer) {
            console.warn('Composer not initialized, cannot set parameters');
            return;
        }

        if (this.bokehPass && this.bokehPass.uniforms) {
            if (newParams.focus !== undefined) {
                this.bokehPass.uniforms["focus"].value = newParams.focus;
                console.log('Focus updated to:', newParams.focus);
            }
            if (newParams.aperture !== undefined) {
                // FIXED: Use reasonable aperture values (0.001 to 0.1 range)
                // Map slider range (0.5-10) to effective range
                const mappedAperture = newParams.aperture * 0.01;
                this.bokehPass.uniforms["aperture"].value = mappedAperture;
                console.log('Aperture updated to:', mappedAperture, '(from slider:', newParams.aperture, ')');
            }
            if (newParams.maxblur !== undefined) {
                this.bokehPass.uniforms["maxblur"].value = newParams.maxblur;
                console.log('Maxblur updated to:', newParams.maxblur);
            }

            // Force material update
            if (this.bokehPass.materialBokeh) {
                this.bokehPass.materialBokeh.needsUpdate = true;
            }
        } else {
            console.error('BokehPass uniforms not found!');
        }

        if (this.colorGradePass) {
            if (newParams.saturation !== undefined) {
                this.colorGradePass.uniforms['saturation'].value = newParams.saturation;
            }
            if (newParams.brightness !== undefined) {
                this.colorGradePass.uniforms['brightness'].value = newParams.brightness;
            }
        }
    }

    updateFocus(focusDistance) {
        if (this.bokehPass && this.bokehPass.uniforms && this.bokehPass.uniforms["focus"]) {
            this.bokehPass.uniforms["focus"].value = focusDistance;
        }
    }

    render() {
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        if (!this.composer) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.composer.setSize(width, height);

        // CRITICAL for r128: Update aspect ratio manually
        if (this.bokehPass && this.bokehPass.uniforms && this.bokehPass.uniforms["aspect"]) {
            this.bokehPass.uniforms["aspect"].value = width / height;
            console.log('Aspect ratio updated to:', width / height);
        }
    }

    debugDOF() {
        console.log('=== DOF Debug ===');

        if (!this.bokehPass) {
            console.log('BokehPass not active.');
            return;
        }

        console.log('BokehPass object:', this.bokehPass);

        if (this.bokehPass.uniforms) {
            console.log('Current uniform values:');
            ['focus', 'aperture', 'maxblur', 'aspect'].forEach(key => {
                if (this.bokehPass.uniforms[key]) {
                    console.log(`  ${key}:`, this.bokehPass.uniforms[key].value);
                } else {
                    console.log(`  ${key}: NOT FOUND`);
                }
            });
        }

        // Check render targets
        if (this.composer) {
            console.log('Render targets:', {
                rt1HasDepth: !!this.composer.renderTarget1.depthTexture,
                rt2HasDepth: !!this.composer.renderTarget2.depthTexture
            });
        }

        console.log('=== End DOF Debug ===');
    }
}

window.PostProcessing = PostProcessing;