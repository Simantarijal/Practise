# Minecraft Clone - Hand/Phone Controls

A 3D voxel-based Minecraft-style game built with HTML5, CSS3, and JavaScript using WebGL for rendering. The game features both desktop and mobile controls, allowing you to play with keyboard/mouse or touch gestures on your phone.

## Features

### 🎮 Game Features
- **3D Voxel World**: Procedurally generated terrain with different block types
- **Block Interaction**: Place and break blocks with raycasting
- **Inventory System**: 6 different block types to choose from
- **Physics**: Gravity, jumping, and collision detection
- **Chunk-based World**: Efficient rendering with chunk loading
- **Real-time FPS Counter**: Monitor performance
- **Position Display**: See your coordinates in real-time

### 📱 Mobile Controls
- **Dual Joystick System**: 
  - Left joystick for movement
  - Right joystick for camera control
- **Action Buttons**:
  - Jump button
  - Place block button
  - Break block button
- **Touch Inventory**: Tap inventory slots to select block types
- **Responsive Design**: Optimized for mobile screens

### 🖥️ Desktop Controls
- **WASD/Arrow Keys**: Move around
- **Mouse**: Look around (click to lock mouse)
- **Left Click**: Break blocks
- **Right Click**: Place blocks
- **Space**: Jump
- **1-6 Keys**: Select block types

## Block Types

1. **🌱 Grass**: Surface blocks
2. **🪨 Stone**: Underground blocks
3. **🪵 Wood**: Building material
4. **🟫 Dirt**: Basic terrain
5. **🟨 Sand**: Beach material
6. **💧 Water**: Liquid blocks

## How to Play

### Getting Started
1. Open `index.html` in a modern web browser
2. Wait for the loading screen to complete
3. The game will start with you positioned above the world

### Mobile Play
1. Use the left joystick to move around
2. Use the right joystick to look around
3. Tap the action buttons to jump, place, or break blocks
4. Tap inventory slots to change your selected block type

### Desktop Play
1. Click on the game area to lock your mouse
2. Use WASD to move and mouse to look around
3. Left click to break blocks, right click to place blocks
4. Press 1-6 to select different block types
5. Press Space to jump

## Technical Details

### Rendering
- **WebGL 2.0/1.0**: Hardware-accelerated 3D graphics
- **Vertex Shaders**: Custom lighting and texturing
- **Fragment Shaders**: Pixel-level effects
- **Matrix Transformations**: 3D camera and object positioning

### World Generation
- **Procedural Terrain**: Uses sine/cosine functions for natural-looking landscapes
- **Chunk System**: 16x16 block chunks for efficient memory usage
- **Render Distance**: 4 chunks in each direction (64 blocks)
- **Dynamic Loading**: Chunks generate as you explore

### Physics System
- **Gravity**: Realistic falling motion
- **Collision Detection**: Block-based collision system
- **Jump Mechanics**: Ground detection and jump force
- **Velocity-based Movement**: Smooth acceleration and deceleration

### Controls Architecture
- **Event-driven Input**: Separate handlers for keyboard, mouse, and touch
- **Joystick Simulation**: Custom touch joystick implementation
- **Pointer Lock**: Mouse capture for desktop controls
- **Touch Event Handling**: Multi-touch support for mobile

## Browser Compatibility

### Required Features
- WebGL support (Chrome 9+, Firefox 4+, Safari 5.1+, Edge 12+)
- ES6+ JavaScript support
- Touch events (for mobile)
- Pointer Lock API (for desktop mouse controls)

### Recommended Browsers
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome Mobile, Safari Mobile, Firefox Mobile

## Performance Tips

1. **Close other tabs** to free up GPU memory
2. **Use a modern browser** for best WebGL performance
3. **Disable browser extensions** that might interfere with WebGL
4. **Keep the game window focused** for optimal performance

## Customization

### Adding New Block Types
1. Add new block type to the inventory array in `game.js`
2. Add corresponding emoji to the HTML inventory slots
3. Implement block-specific rendering logic

### Modifying World Generation
1. Edit the `generateChunk()` method in `game.js`
2. Modify the height calculation algorithm
3. Add new terrain features like caves or structures

### Adjusting Controls
1. Modify sensitivity values in the control setup
2. Add new key bindings in the event listeners
3. Customize joystick behavior for mobile

## Development

### File Structure
```
minecraft-clone/
├── index.html      # Main HTML file
├── style.css       # CSS styling and responsive design
├── game.js         # Main game logic and WebGL rendering
└── README.md       # This documentation
```

### Key Classes and Methods
- `MinecraftGame`: Main game class
- `setupWebGL()`: WebGL context initialization
- `setupControls()`: Input handling setup
- `generateChunk()`: World generation logic
- `render()`: Main rendering loop
- `update()`: Game state updates

## Future Enhancements

- [ ] Texture mapping for different block types
- [ ] Multiplayer support
- [ ] Save/load world functionality
- [ ] More complex world generation (caves, structures)
- [ ] Sound effects and background music
- [ ] Day/night cycle
- [ ] Crafting system
- [ ] More block types and materials

## License

This project is open source and available under the MIT License.

---

**Enjoy building and exploring your Minecraft world!** 🎮