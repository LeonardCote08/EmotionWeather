
# Emotion Weather - A Miniature Earth Diorama

A photorealistic 3D Earth visualization designed to evoke the aesthetic of a handcrafted miniature diorama. This project leverages high-resolution textures, advanced shader techniques, and a post-processing pipeline to create a compelling tilt-shift effect, transforming our planet into a tiny, captivating model.

## ✨ Features

### Visual Core
- **Photorealistic Textures**: Utilizes 2K resolution maps for daytime color, surface roughness (specular), and clouds.
- **Hybrid Relief System**:
  - **Displacement Mapping**: Real geometric deformation of the sphere's surface to create physically high mountains and deep valleys, controlled by a high-quality height map.
  - **Normal Mapping**: Fine-grained surface details that react to light, adding a layer of micro-texture.
- **Dynamic Cloud Layer**: A smooth, independent sphere of clouds that floats realistically above the terrain, complete with its own rotation.
- **Atmospheric Glow**: A soft, physically-based atmospheric haze that realistically frames the planet against the darkness of space.
- **Vibrant Starfield**: A backdrop of thousands of stars to complete the scene.

### Interaction & Effects
- **Full Diorama Control**: A comprehensive debug panel allows for real-time artistic direction of the scene.
- **Post-Processing Pipeline**: An `EffectComposer` with `BokehPass` for high-quality, physically-based depth of field (tilt-shift) and a custom color grading pass.
- **Interactive Globe**: Intuitive click-and-drag rotation with momentum physics, making the globe feel tangible.
- **Auto-Rotation**: The globe gently resumes its spin after interaction ceases.
- **Touch Support**: Fully responsive interaction on mobile and tablet devices.

## 🛠️ File Structure

The project has been streamlined to focus on texture-based rendering. The old procedural generation files have been removed.

```
emotion-weather/
├── index.html                    # Main HTML file with the UI and debug panel
├── assets/
│   └── textures/
│       ├── 2k_earth_day.jpg      # Albedo/Color map
│       ├── 2k_earth_height.jpg   # Height map for displacement
│       ├── 2k_earth_normal_map.jpg # Normal map for surface detail
│       ├── 2k_earth_specular_map.jpg # Roughness/specular control
│       └── 2k_earth_clouds.jpg   # Cloud layer texture
├── js/
│   ├── app.js                    # Main application logic, scene setup, interaction
│   └── postProcessing.js         # Post-processing setup (BokehPass, Color Grading)
└── README.md                     # This file
```

## 🚀 Getting Started

To run this project locally, a local web server is required to avoid browser CORS errors when loading textures.

1.  **Clone or download the repository.**
2.  **Navigate to the project directory** in your terminal.
3.  **Start a local server.** The simplest method is using Python:

    ```bash
    # If you have Python 3 installed
    python -m http.server

    # Or if you have Python 2
    python -m SimpleHTTPServer
    ```
4.  **Open your browser** and navigate to `http://localhost:8000`.

## 🎨 Controls & Creative Direction

The heart of this project is the ability to fine-tune the diorama effect. Open the debug panel with **`Ctrl+D`**.

### Diorama Effect Sliders
- **Relief (`normalScale`)**: Controls the intensity of the fine surface details. Subtle values (0.5-1.5) add texture, while high values can simulate rough, unpainted material.
- **Déplacement (`displacementScale`)**: The most critical slider for the miniature effect. It controls the "exaggeration" of the mountains. Higher values make the Earth appear more rugged and toy-like.

### Post-Processing Sliders
- **Luminosité (`brightness`)**: Adjusts the overall scene brightness. Crucial for achieving the "over-lit" look of a studio photograph of a model.
- **Saturation**: Boosts color vibrancy. High saturation is a key component of the miniature aesthetic, making colors pop like fresh paint.
- **Focus**: Sets the distance from the camera that will be perfectly sharp.
- **Aperture**: Controls the strength of the blur effect. Low values create a very shallow depth of field (intense blur), which strongly enhances the tilt-shift illusion.
- **Max Blur**: A cap on the blur intensity to manage performance.

### Keyboard Shortcuts
| Key      | Action                               |
| :------- | :----------------------------------- |
| `Ctrl+D` | Toggle the debug control panel.      |
| `R`      | Reset all parameters to their defaults. |
| `T`      | Toggle visibility of test objects for DOF calibration. |
| `F`      | Toggle automatic focus based on mouse position. |
| `A`      | Toggle the globe's auto-rotation.    |
| `S`      | Log the detailed application state to the console. |
| `L`      | Toggle frame-by-frame performance logging. |
| `1/2/3`  | Set focus presets (near, middle, far). |

## 💡 How to Achieve the Miniature Look

Creating the diorama illusion is an art. Here's a guide to using the controls effectively:

1.  **Exaggerate the Scale**: Start by increasing **Déplacement**. Push the mountains up until they feel satisfyingly oversized and rugged. This is the foundation of the effect.
2.  **Add the "Painted Toy" Finish**: Increase **Saturation** and **Luminosité**. The goal is to move away from realistic lighting towards a bright, vibrant, "studio-lit" aesthetic.
3.  **Apply the Tilt-Shift Lens**: Now, create the depth-of-field effect. Lower the **Aperture** value significantly (e.g., to 1-5) to get a strong blur.
4.  **Find Your Focus**: Adjust the **Focus** slider to create a sharp "slice" through the globe. Focusing slightly in front of or behind the center often yields the most compelling results.

## 🔬 Technical Approach

- **Hybrid Rendering**: The core visual technique combines two methods for creating relief. `Displacement Mapping` alters the actual vertex positions on the GPU for large-scale geographic features, while `Normal Mapping` manipulates lighting on a per-pixel basis for fine surface detail.
- **Shader Injection with `onBeforeCompile`**: Instead of writing shaders from scratch, we inject custom GLSL code directly into Three.js's standard `MeshStandardMaterial`. This allows us to add features like displacement while retaining all the benefits of a physically-based material (lighting, shadows, etc.).
- **Decoupled Layers**: The Earth's surface and the cloud layer are rendered as separate, independent spheres. This prevents the "shrink-wrapping" artifact where clouds would unnaturally hug the terrain, creating a more believable sense of atmosphere and altitude.

## 🔮 Future Enhancements

With a solid visual foundation, the project is now ready for its primary purpose:

- **[ ] Real-time Emotion Data Visualization**: Implement systems to fetch and display global emotional patterns on the surface of the diorama.
- **[ ] Re-implement Night-Side Lights**: Re-activate the disabled night-map logic to add glowing city lights, further enhancing the miniature illusion.
- **[ ] Advanced Atmospheric Effects**: Introduce dynamic weather patterns or more complex cloud shaders.
- **[ ] User-Controlled Day/Night Cycle**: Allow the user to drag the sun's position to change the lighting dynamically.

## 📚 Credits & Resources

- **3D Engine**: [Three.js](https://threejs.org/) (r128)
- **Primary Textures**: [NASA Visible Earth](https://visibleearth.nasa.gov/) and [Planet Pixel Emporium](http://planetpixelemporium.com/earth.html) for their high-quality public domain texture maps.
- **Inspiration**: Tilt-shift photography and practical miniature model making.
