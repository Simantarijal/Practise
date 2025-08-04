# Minecraft with Hand/Phone Controls

A 3D Minecraft-style game built with HTML, CSS, and JavaScript featuring hand gesture controls and phone motion controls.

## Features

- **3D World**: Procedurally generated terrain with trees, water, and various block types
- **Multiple Control Methods**:
  - Keyboard and mouse controls
  - Hand gesture controls using MediaPipe
  - Phone motion controls using device sensors
- **Block System**: Place and destroy different types of blocks (grass, stone, wood, sand, water)
- **Modern UI**: Responsive design with game statistics and block selector
- **Cross-platform**: Works on desktop and mobile devices

## Controls

### Hand Controls (Desktop with Camera)
- 👆 **Point finger**: Look around
- ✊ **Fist**: Move forward
- ✋ **Open palm**: Place block
- 👌 **Pinch gesture**: Destroy block

### Phone Controls
- 📱 **Tilt phone**: Look around
- 📱 **Shake phone**: Jump
- 📱 **Tap screen**: Place/destroy block

### Keyboard Controls
- **WASD**: Move
- **Mouse**: Look around
- **Left Click**: Place block
- **Right Click**: Destroy block
- **Space**: Jump

## How to Run

1. **Local Server**: Due to camera access requirements, you need to run this on a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

2. **Open in Browser**: Navigate to `http://localhost:8000`

3. **Enable Camera**: When prompted, allow camera access for hand controls

## Technical Details

### Technologies Used
- **Three.js**: 3D graphics and rendering
- **MediaPipe**: Hand gesture recognition
- **Device Orientation API**: Phone motion detection
- **Pointer Lock API**: Mouse controls
- **WebGL**: Hardware-accelerated graphics

### Game Features
- **Procedural Terrain**: Height-based terrain generation with natural features
- **Physics**: Gravity, collision detection, and jumping mechanics
- **Block System**: Dynamic block placement and removal
- **Performance**: Optimized rendering with shadow mapping and fog
- **Responsive Design**: Adapts to different screen sizes

### Block Types
- 🌱 **Grass**: Green surface blocks
- 🪨 **Stone**: Gray underground blocks
- 🪵 **Wood**: Brown tree trunk blocks
- 🏖️ **Sand**: Yellow beach blocks
- 💧 **Water**: Blue water blocks

## Browser Compatibility

- **Desktop**: Chrome, Firefox, Safari, Edge (with camera support)
- **Mobile**: iOS Safari, Android Chrome (with motion sensors)
- **Requirements**: WebGL support, camera access for hand controls

## Performance Tips

- Close other browser tabs to free up memory
- Use a modern browser for best performance
- On mobile, ensure good lighting for hand detection
- Disable hand controls if not using them to save resources

## Troubleshooting

### Hand Controls Not Working
- Ensure camera access is granted
- Check browser console for errors
- Try refreshing the page
- Ensure good lighting conditions

### Mobile Controls Not Working
- Check if device orientation is enabled
- Ensure motion sensors are available
- Try rotating device to calibrate

### Performance Issues
- Reduce browser window size
- Close other applications
- Check browser's hardware acceleration settings

## Development

The game is built with a modular architecture:
- `index.html`: Main HTML structure
- `styles.css`: UI styling and responsive design
- `game.js`: Core game logic and 3D rendering

### Key Classes
- `MinecraftGame`: Main game controller
- Hand gesture detection using MediaPipe
- Mobile motion controls using device sensors
- Three.js scene management and rendering

## License

This project is open source and available under the MIT License.