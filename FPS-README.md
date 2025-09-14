# 3D First-Person Shooter Game

A complete 3D FPS game built with Three.js, Cannon.js, and vanilla JavaScript. Play directly in your web browser!

## 🎮 Features

- **First-Person Controls**: Mouse look + WASD movement
- **Weapon System**: Shoot, reload, ammo management
- **Enemy AI**: Red cone enemies that chase and attack the player
- **Physics**: Realistic collision detection and movement
- **Sound Effects**: Procedural audio for shooting, hits, and reloading
- **Health System**: Take damage from enemies, health bar display
- **Wave System**: Progressively more challenging waves
- **Modern UI**: Crosshair, HUD, game screens
- **Responsive Design**: Works on desktop and mobile

## 🚀 How to Play

1. **Open the game**: Open `fps-game.html` in your web browser
2. **Start**: Click "Start Game" button
3. **Controls**:
   - `WASD` - Move around
   - `Mouse` - Look around (first-person view)
   - `Left Click` - Shoot
   - `R` - Reload weapon
   - `Space` - Jump
   - `Escape` - Pause game

## 🎯 Gameplay

- **Objective**: Survive waves of red cone enemies
- **Combat**: Shoot enemies to eliminate them
- **Health**: Avoid enemy attacks to stay alive
- **Ammo**: Manage your ammunition - reload when needed
- **Waves**: Each wave spawns more enemies
- **Score**: Earn points for each enemy killed

## 🛠️ Technical Details

### Built With
- **Three.js** - 3D graphics rendering
- **Cannon.js** - Physics simulation
- **Web Audio API** - Sound effects
- **Pointer Lock API** - Mouse capture for FPS controls
- **Vanilla JavaScript** - No frameworks, pure JS

### File Structure
```
fps-game.html      # Main HTML file
fps-style.css      # Game styling and UI
fps-game.js        # Complete game logic
FPS-README.md      # This documentation
```

### Key Classes
- `FPSGame` - Main game controller
- `Player` - Player character with movement and shooting
- `Enemy` - AI enemies with pathfinding
- `Bullet` - Projectile physics and collision

## 🌐 Browser Compatibility

- **Chrome** ✅ (Recommended)
- **Firefox** ✅
- **Safari** ✅
- **Edge** ✅
- **Mobile browsers** ✅ (Touch controls)

## 🚀 Deployment

### GitHub Pages
1. Upload all files to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Select source branch (usually `main`)
4. Your game will be available at `username.github.io/repository-name`

### Local Development
1. Clone or download the files
2. Open `fps-game.html` in any modern web browser
3. No server required - runs entirely client-side

## 🎨 Customization

### Easy Modifications
- **Enemy count**: Change `enemiesToSpawn` in game initialization
- **Player speed**: Modify `speed` property in Player class
- **Weapon damage**: Adjust `damage` value in Bullet class
- **Colors**: Update material colors in Three.js meshes
- **Sounds**: Modify frequency values in audio functions

### Advanced Features
- Add new weapon types
- Create different enemy types
- Implement power-ups
- Add multiple levels
- Create multiplayer support

## 🐛 Troubleshooting

### Common Issues
1. **Mouse not working**: Click on the game area to enable pointer lock
2. **No sound**: Check browser audio permissions
3. **Performance issues**: Lower graphics settings or close other tabs
4. **Mobile controls**: Use touch to look around, virtual buttons for movement

### Performance Tips
- Close unnecessary browser tabs
- Use Chrome for best performance
- Ensure stable internet connection for CDN resources

## 📱 Mobile Support

The game includes responsive design and works on mobile devices:
- Touch controls for camera movement
- Virtual buttons for WASD movement
- Optimized UI for smaller screens

## 🔧 Development

### Adding New Features
1. **New Enemy Types**: Extend the Enemy class
2. **Weapons**: Create new weapon classes
3. **Levels**: Add new level generation functions
4. **UI Elements**: Modify the HTML and CSS

### Code Structure
- Game loop runs at ~60 FPS
- Physics simulation with Cannon.js
- Event-driven input handling
- Modular class-based architecture

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements!

## 🎮 Enjoy the Game!

Have fun playing and feel free to modify the code to create your own unique FPS experience!
