/**
 * Post-processing module for Emotion Weather
 * This version's default values are tweaked to complement the new, brighter lighting model.
 * CRITICAL FIX: Aperture scaling corrected for visible DOF effect.
 */

const ColorGradeShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'saturation': { value: 1.3 },
        'vignette': { value: 0.4 },
        // NOUVEAU: Le shader a déjà ce qu'il faut, on l'expose juste.
        'brightness': { value: 1.0, },
        'contrast': { value: 1.1, }
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
            
            color = (color - 0.5) * contrast + 0.5;
            color *= brightness;
            color = adjustSaturation(color, saturation);
            
            float luma = dot(color, vec3(0.299, 0.587, 0.114));
            vec3 warm = vec3(1.05, 1.0, 0.95);
            vec3 cool = vec3(0.95, 1.0, 1.05);
            color *= mix(cool, warm, luma);
            
            vec2 center = vUv - 0.5;
            float dist = length(center * 1.2);
            float vig = smoothstep(0.8, 0.2, dist);
            color = mix(color * (1.0 - vignette), color, vig);
            
            gl_FragColor = vec4(clamp(color, 0.0, 1.0), texel.a);
        }`
};

class PostProcessing {
    constructor(renderer, scene, camera) {
        this.renderer = renderer; this.scene = scene; this.camera = camera; this.params = {};
        try { this.initComposer(); }
        catch (e) { console.error('Fatal error initializing EffectComposer.', e); this.composer = null; }
    }
    initComposer() {
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
        this.bokehPass = new THREE.BokehPass(this.scene, this.camera, { focus: 9.0, aperture: 5.0 * 0.0002, maxblur: 0.015, width: window.innerWidth, height: window.innerHeight });
        this.composer.addPass(this.bokehPass);
        this.colorGradePass = new THREE.ShaderPass(ColorGradeShader);
        this.composer.addPass(this.colorGradePass);
        this.colorGradePass.renderToScreen = true;
    }

    setParameters(newParams) {
        Object.assign(this.params, newParams);
        if (!this.composer) return;

        if (this.bokehPass) {
            if (newParams.focus !== undefined) this.bokehPass.uniforms["focus"].value = newParams.focus;
            if (newParams.aperture !== undefined) this.bokehPass.uniforms["aperture"].value = newParams.aperture * 0.0002;
            if (newParams.maxblur !== undefined) this.bokehPass.uniforms["maxblur"].value = newParams.maxblur;
        }
        if (this.colorGradePass) {
            if (newParams.saturation !== undefined) this.colorGradePass.uniforms['saturation'].value = newParams.saturation;
            // NOUVEAU: Mettre à jour la luminosité
            if (newParams.brightness !== undefined) this.colorGradePass.uniforms['brightness'].value = newParams.brightness;
        }
    }

    updateFocus(focusDistance) { if (this.bokehPass) { this.bokehPass.uniforms["focus"].value = focusDistance; } }
    render() { if (this.composer) { this.composer.render(); } else { this.renderer.render(this.scene, this.camera); } }
    onWindowResize() { if (!this.composer) return; const width = window.innerWidth; const height = window.innerHeight; this.composer.setSize(width, height); if (this.bokehPass) { this.bokehPass.uniforms['aspect'].value = width / height; } }
    debugDOF() { if (!this.bokehPass) { console.log('BokehPass not active.'); return; } console.log('DOF Debug:', { params: this.params, uniforms: { focus: this.bokehPass.uniforms["focus"].value, aperture: this.bokehPass.uniforms["aperture"].value, maxblur: this.bokehPass.uniforms["maxblur"].value } }); }
}

window.PostProcessing = PostProcessing;