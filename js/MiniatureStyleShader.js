// This file should be saved as js/MiniatureStyleShader.js

/**
 * Miniature Style Shader - Transform realistic Earth into painted miniature
 * Inspired by "Night of the Mini Dead" aesthetic
 */

window.MiniatureStyleShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'stylization': { value: 1.0 },      // 0 = realistic, 1 = full miniature
        'paintEffect': { value: 0.8 },      // Painted plastic look
        'colorShift': { value: 1.0 },       // Fantasy color shifting
        'nightMode': { value: 0.0 },        // Night atmosphere
        'glowIntensity': { value: 0.5 }     // Magical glow effect
    },

    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float stylization;
        uniform float paintEffect;
        uniform float colorShift;
        uniform float nightMode;
        uniform float glowIntensity;
        
        varying vec2 vUv;
        
        // Convert to painted toy colors
        vec3 toyifyColor(vec3 color) {
            // Posterize colors for painted effect
            float levels = mix(256.0, 8.0, paintEffect);
            color = floor(color * levels) / levels;
            
            // Boost saturation dramatically
            float gray = dot(color, vec3(0.299, 0.587, 0.114));
            color = mix(vec3(gray), color, 1.0 + stylization * 2.0);
            
            // Shift colors to fantasy palette
            vec3 fantasyShift = vec3(1.0, 0.85, 1.15); // Purple/orange tint
            color *= mix(vec3(1.0), fantasyShift, colorShift * stylization);
            
            return color;
        }
        
        // Add plastic/glossy material look
        vec3 plasticMaterial(vec3 color, vec2 uv) {
            // Fake specular highlight
            vec2 center = uv - 0.5;
            float dist = length(center);
            float highlight = 1.0 - smoothstep(0.0, 0.5, dist);
            highlight = pow(highlight, 3.0) * 0.3 * paintEffect;
            
            return color + vec3(highlight);
        }
        
        // Night atmosphere with eerie glow
        vec3 nightAtmosphere(vec3 color) {
            // Darken overall
            color *= mix(1.0, 0.3, nightMode);
            
            // Add purple/green atmospheric glow
            vec3 nightGlow = vec3(0.5, 0.0, 1.0); // Purple
            vec3 eerieGlow = vec3(0.0, 1.0, 0.5); // Green
            
            float glowMask = pow(1.0 - length(vUv - 0.5) * 2.0, 2.0);
            vec3 glow = mix(nightGlow, eerieGlow, sin(vUv.x * 10.0) * 0.5 + 0.5);
            
            color += glow * glowMask * glowIntensity * nightMode;
            
            return color;
        }
        
        void main() {
            vec3 color = texture2D(tDiffuse, vUv).rgb;
            
            // Apply miniature transformation
            color = toyifyColor(color);
            color = plasticMaterial(color, vUv);
            color = nightAtmosphere(color);
            
            // Add vignette for diorama feeling
            float vignette = 1.0 - length(vUv - 0.5) * 0.8;
            color *= mix(1.0, vignette, stylization * 0.5);
            
            gl_FragColor = vec4(color, 1.0);
        }
    `
};