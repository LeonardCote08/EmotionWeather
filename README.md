# 🌍 Emotion Weather - A Miniature Earth Diorama

A stunning 3D Earth visualization that transforms from photorealistic rendering to a whimsical miniature diorama inspired by "Night of the Mini Dead". This project showcases advanced WebGL techniques including tilt-shift depth-of-field, stylized rendering, and dramatic lighting effects.

## ✨ Features

### Core Visualization
- **High-Resolution Earth Rendering**: Photorealistic 2K textures for terrain, clouds, and surface details
- **Advanced Relief Mapping**: 
  - Displacement mapping for genuine geometric mountains and valleys
  - Normal mapping for fine surface details
  - Adjustable terrain exaggeration for miniature effect
- **Dynamic Atmosphere**: Customizable atmospheric glow with fantasy color options
- **Animated Cloud Layer**: Independent cloud sphere with realistic movement
- **Stylized Starfield**: 15,000+ colorful stars with varied hues

### Visual Effects & Post-Processing
- **Tilt-Shift Depth-of-Field**: 
  - BokehPass implementation optimized for Three.js r128
  - Adjustable focus distance, aperture, and blur intensity
  - Creates authentic miniature photography effect
- **Miniature Style Transformation**:
  - Real-time style morphing from realistic to painted diorama
  - Posterization and paint effects
  - Plastic/toy material simulation
  - Fantasy color grading
- **Night Mode**: Atmospheric horror-inspired lighting with magical glows
- **Color Grading**: Saturation, brightness, contrast, and vignette controls

### Interaction & Controls
- **Intuitive Globe Interaction**:
  - Click and drag rotation with momentum physics
  - Touch-enabled for mobile devices
  - Auto-rotation with smooth resume after interaction
- **Comprehensive Debug Panel** (Ctrl+D):
  - Real-time parameter adjustment
  - Visual style presets
  - Performance monitoring
  - Test object visualization

### Style Presets
- **Réaliste**: Photorealistic Earth with natural lighting
- **Miniature**: Colorful diorama with enhanced saturation and toy-like materials
- **Night of Mini Dead**: Full fantasy transformation with eerie atmosphere

## 🛠️ Technical Stack

- **Three.js r128**: Core 3D rendering engine
- **Custom GLSL Shaders**: For atmosphere, ocean shine, and style effects
- **Post-Processing Pipeline**: 
  - EffectComposer with multiple passes
  - Custom MiniatureStyleShader
  - BokehPass for depth-of-field
  - ColorGradeShader for final touches
- **Optimized Performance**: 60fps target with dynamic quality adjustment

## 📁 Project Structure

```
emotion-weather/
├── index.html                      # Main application with UI
├── assets/
│   └── textures/                   # Earth texture maps (2K resolution)
│       ├── 2k_earth_day.jpg       # Albedo/color map
│       ├── 2k_earth_height.jpg    # Displacement map
│       ├── 2k_earth_normal_map.jpg # Normal map
│       ├── 2k_earth_specular_map.jpg # Roughness map
│       └── 2k_earth_clouds.jpg    # Cloud layer
├── js/
│   ├── app.js                     # Main application logic
│   ├── postProcessing.js          # Post-processing pipeline
│   ├── MiniatureStyleShader.js    # Custom style transformation shader
│   └── scene/
│       ├── lights.js              # Dramatic lighting setup
│       └── world.js               # Earth and environment creation
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser with WebGL 2.0 support
- Local web server (for texture loading)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/emotion-weather.git
   cd emotion-weather
   ```

2. **Start a local server**
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (with http-server installed)
   npx http-server -p 8000

   # VS Code Live Server extension
   # Right-click index.html → "Open with Live Server"
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## 🎮 Controls

### Mouse/Touch Controls
- **Left Click + Drag**: Rotate the globe
- **Release**: Globe continues with momentum
- **Wait 2s**: Auto-rotation resumes

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl+D` | Toggle debug control panel |
| `A` | Toggle auto-rotation |
| `T` | Show/hide test objects (for DOF calibration) |
| `F` | Toggle auto-focus mode |
| `R` | Reset all parameters to defaults |
| `S` | Log detailed state to console |
| `L` | Toggle frame-by-frame logging |
| `D` | Debug DOF parameters |
| `1/2/3` | Focus presets (near/earth/far) |

## 🎨 Debug Panel Parameters

### Post-Processing
- **Focus** (4-12): Distance from camera for sharp focus
- **Aperture** (0.5-10): Depth of field strength (lower = more blur)
- **Max Blur** (0-0.05): Maximum blur amount
- **Saturation** (0-2.5): Color intensity
- **Luminosité** (0.5-2): Overall brightness

### Diorama Effect
- **Relief** (0-3): Normal map intensity for surface details
- **Déplacement** (0-0.3): Height map displacement scale
- **Océan Brillant** (0-1): Ocean surface shininess

### Miniature Style
- **Stylisation** (0-1): Morph between realistic and toy-like
- **Effet Peinture** (0-1): Painted plastic appearance
- **Mode Nuit** (0-1): Night atmosphere with eerie lighting
- **Lueur Magique** (0-2): Supernatural glow intensity

## 🎭 Creating the Miniature Effect

### Quick Start
1. Press `Ctrl+D` to open debug panel
2. Click **"Miniature"** preset button
3. Fine-tune with sliders

### Manual Setup for Best Results
1. **Set Focus**: Use value around 6.1 for Earth surface
2. **Adjust DOF**: 
   - Aperture: 3-5 for strong tilt-shift
   - Max Blur: 0.02-0.03
3. **Enhance Colors**:
   - Saturation: 1.5-1.8
   - Brightness: 1.1-1.3
4. **Exaggerate Terrain**:
   - Déplacement: 0.15-0.2
   - Relief: 1.2-1.5
5. **Apply Style**:
   - Stylisation: 0.7-1.0
   - Effet Peinture: 0.6-0.8

### Night of the Mini Dead Effect
Click the **"Night of Mini Dead"** preset for:
- Dramatic theatrical lighting
- Purple/green atmospheric glow
- Posterized colors
- Maximum terrain exaggeration
- Eerie night atmosphere

## 🔧 Technical Details

### Shader Modifications
- **Vertex Shader**: Custom displacement mapping with adjustable scale
- **Fragment Shader**: 
  - Ocean shine detection and enhancement
  - Posterization for paint effect
  - Plastic material simulation
  - Fantasy color grading

### Performance Optimizations
- Texture atlasing for reduced draw calls
- LOD system ready (commented for future use)
- Efficient shader calculations
- Render target management for post-processing

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: WebGL 2.0 required
- Mobile: Touch controls supported

## 🎯 Future Enhancements

- [ ] Real-time emotion data visualization
- [ ] City lights on night side
- [ ] Weather system with animated clouds
- [ ] Biome-based color variations
- [ ] Multi-language support
- [ ] Save/load preset configurations
- [ ] Screenshot functionality
- [ ] VR mode support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **NASA Visible Earth**: High-quality Earth textures
- **Three.js Community**: Excellent documentation and examples
- **"Night of the Mini Dead"**: Visual inspiration for the miniature aesthetic
- **Tilt-shift Photography**: Technical inspiration for depth-of-field effects

## 📸 Screenshots

*Note: Add screenshots here showing:*
- *Realistic mode*
- *Miniature mode* 
- *Night of Mini Dead mode*
- *Debug panel interface*

---

**Created with ❤️ for the Emotion Weather project**