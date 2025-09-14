// 3D FPS Game - Main Game Logic
class FPSGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.enemiesToSpawn = 5;
        this.enemiesSpawned = 0;
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000; // 2 seconds
        
        // Input handling
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;
        
        // Audio context
        this.audioContext = null;
        this.sounds = {};
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.setupThreeJS();
        this.setupPhysics();
        this.setupAudio();
        this.createPlayer();
        this.createLevel();
        this.setupUI();
        
        // Start the game loop
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Handle special keys
            if (e.code === 'Escape') {
                this.togglePause();
            }
            if (e.code === 'KeyR' && this.player) {
                this.player.reload();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse events
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.mouseX += e.movementX * this.mouseSensitivity;
                this.mouseY += e.movementY * this.mouseSensitivity;
                this.mouseY = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouseY));
            }
        });
        
        document.addEventListener('click', (e) => {
            if (this.gameState === 'menu') {
                this.startGame();
            } else if (this.gameState === 'playing' && this.isPointerLocked && this.player) {
                this.player.shoot();
            }
        });
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === document.getElementById('gameCanvas');
        });
        
        // UI button events - with error handling
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        const resumeBtn = document.getElementById('resumeBtn');
        const mainMenuBtn = document.getElementById('mainMenuBtn');
        
        if (startBtn) startBtn.addEventListener('click', () => this.startGame());
        if (restartBtn) restartBtn.addEventListener('click', () => this.restartGame());
        if (resumeBtn) resumeBtn.addEventListener('click', () => this.resumeGame());
        if (mainMenuBtn) mainMenuBtn.addEventListener('click', () => this.showMainMenu());
    }
    
    setupThreeJS() {
        const canvas = document.getElementById('gameCanvas');
        
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x404040, 10, 100); // Changed to gray fog for visibility
        this.scene.background = new THREE.Color(0x404040); // Gray background instead of black
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.6, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x404040); // Gray background
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        // Lighting - Much brighter
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Much brighter ambient
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Brighter directional
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -25;
        directionalLight.shadow.camera.right = 25;
        directionalLight.shadow.camera.top = 25;
        directionalLight.shadow.camera.bottom = -25;
        this.scene.add(directionalLight);
        
        // Add some additional lighting
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
        pointLight.position.set(0, 10, 0);
        this.scene.add(pointLight);
        
        console.log('Three.js setup complete');
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupPhysics() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
    }
    
    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    createSounds() {
        // Create procedural sounds
        this.sounds = {
            shoot: this.createShootSound(),
            hit: this.createHitSound(),
            reload: this.createReloadSound(),
            enemyDeath: this.createEnemyDeathSound()
        };
    }
    
    createShootSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }
    
    createHitSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.05);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
        };
    }
    
    createReloadSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }
    
    createEnemyDeathSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }
    
    createPlayer() {
        this.player = new Player(this.scene, this.world, this.camera);
    }
    
    createLevel() {
        console.log('Creating level...');
        
        // Ground - Make it more visible
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x666666,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        console.log('Ground added');
        
        // Ground physics
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.add(groundBody);
        
        // Add a test cube to make sure rendering works
        const testGeometry = new THREE.BoxGeometry(2, 2, 2);
        const testMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const testCube = new THREE.Mesh(testGeometry, testMaterial);
        testCube.position.set(0, 1, -5);
        testCube.castShadow = true;
        testCube.receiveShadow = true;
        this.scene.add(testCube);
        console.log('Test cube added');
        
        // Walls
        this.createWalls();
        
        // Obstacles
        this.createObstacles();
        
        console.log('Level creation complete');
    }
    
    createWalls() {
        const wallHeight = 5;
        const wallThickness = 1;
        const wallLength = 100;
        
        // Create walls around the perimeter
        const walls = [
            { pos: [0, wallHeight/2, -wallLength/2], size: [wallLength, wallHeight, wallThickness] }, // North
            { pos: [0, wallHeight/2, wallLength/2], size: [wallLength, wallHeight, wallThickness] },  // South
            { pos: [-wallLength/2, wallHeight/2, 0], size: [wallThickness, wallHeight, wallLength] }, // West
            { pos: [wallLength/2, wallHeight/2, 0], size: [wallThickness, wallHeight, wallLength] }   // East
        ];
        
        walls.forEach(wall => {
            // Visual wall
            const geometry = new THREE.BoxGeometry(wall.size[0], wall.size[1], wall.size[2]);
            const material = new THREE.MeshLambertMaterial({ color: 0x666666 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            
            // Physics wall
            const shape = new CANNON.Box(new CANNON.Vec3(wall.size[0]/2, wall.size[1]/2, wall.size[2]/2));
            const body = new CANNON.Body({ mass: 0 });
            body.addShape(shape);
            body.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
            this.world.add(body);
        });
    }
    
    createObstacles() {
        // Create some random obstacles
        const obstaclePositions = [
            [10, 0, 10], [-10, 0, 10], [10, 0, -10], [-10, 0, -10],
            [20, 0, 0], [-20, 0, 0], [0, 0, 20], [0, 0, -20]
        ];
        
        obstaclePositions.forEach(pos => {
            const geometry = new THREE.BoxGeometry(2, 3, 2);
            const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const obstacle = new THREE.Mesh(geometry, material);
            obstacle.position.set(pos[0], pos[1] + 1.5, pos[2]);
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            this.scene.add(obstacle);
            
            // Physics obstacle
            const shape = new CANNON.Box(new CANNON.Vec3(1, 1.5, 1));
            const body = new CANNON.Body({ mass: 0 });
            body.addShape(shape);
            body.position.set(pos[0], pos[1] + 1.5, pos[2]);
            this.world.add(body);
        });
    }
    
    setupUI() {
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('healthText').textContent = Math.max(0, this.player.health);
        document.getElementById('healthFill').style.width = `${this.player.health}%`;
        document.getElementById('currentAmmo').textContent = this.player.currentAmmo;
        document.getElementById('totalAmmo').textContent = this.player.totalAmmo;
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('waveValue').textContent = this.wave;
    }
    
    startGame() {
        console.log('startGame() called');
        this.gameState = 'playing';
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.enemiesToSpawn = 5;
        this.enemiesSpawned = 0;
        
        // Clear existing enemies
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];
        
        // Reset player
        if (this.player) {
            this.player.reset();
        } else {
            console.error('Player not initialized!');
        }
        
        // Hide start screen, show game
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const pauseScreen = document.getElementById('pauseScreen');
        
        if (startScreen) startScreen.classList.add('hidden');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        if (pauseScreen) pauseScreen.classList.add('hidden');
        
        // Request pointer lock
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.requestPointerLock();
        } else {
            console.error('Canvas not found!');
        }
        
        this.updateUI();
        console.log('Game started successfully');
    }
    
    restartGame() {
        this.startGame();
    }
    
    showMainMenu() {
        this.gameState = 'menu';
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.exitPointerLock();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.pauseGame();
        } else if (this.gameState === 'paused') {
            this.resumeGame();
        }
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pauseScreen').classList.remove('hidden');
        document.exitPointerLock();
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('gameCanvas').requestPointerLock();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.exitPointerLock();
    }
    
    spawnEnemy() {
        if (this.enemiesSpawned >= this.enemiesToSpawn) return;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 20;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        const enemy = new Enemy(this.scene, this.world, x, 0, z, this.player);
        this.enemies.push(enemy);
        this.enemiesSpawned++;
    }
    
    nextWave() {
        this.wave++;
        this.enemiesToSpawn += 3;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
    }
    
    updateEnemies(deltaTime) {
        this.enemies.forEach((enemy, index) => {
            enemy.update(deltaTime);
            
            if (enemy.health <= 0) {
                this.sounds.enemyDeath();
                this.score += 100;
                this.enemiesKilled++;
                enemy.destroy();
                this.enemies.splice(index, 1);
                
                if (this.enemiesKilled >= this.enemiesToSpawn) {
                    this.nextWave();
                }
            }
        });
    }
    
    updateBullets(deltaTime) {
        this.bullets.forEach((bullet, index) => {
            bullet.update(deltaTime);
            
            if (bullet.shouldDestroy) {
                bullet.destroy();
                this.bullets.splice(index, 1);
            }
        });
    }
    
    checkCollisions() {
        // Check bullet-enemy collisions
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (bullet.checkCollision(enemy)) {
                    enemy.takeDamage(bullet.damage);
                    this.sounds.hit();
                    bullet.destroy();
                    this.bullets.splice(bulletIndex, 1);
                }
            });
        });
        
        // Check enemy-player collisions
        this.enemies.forEach(enemy => {
            if (enemy.checkPlayerCollision(this.player)) {
                this.player.takeDamage(10);
                this.showDamageFlash();
            }
        });
    }
    
    showDamageFlash() {
        const flash = document.createElement('div');
        flash.className = 'damage-flash';
        document.getElementById('gameUI').appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 300);
    }
    
    gameLoop() {
        const deltaTime = 0.016; // Approximate 60 FPS
        
        if (this.gameState === 'playing') {
            // Update player
            if (this.player) {
                this.player.update(deltaTime, this.keys, this.mouseX, this.mouseY);
            }
            
            // Spawn enemies
            if (Date.now() - this.lastSpawnTime > this.spawnInterval && this.enemiesSpawned < this.enemiesToSpawn) {
                this.spawnEnemy();
                this.lastSpawnTime = Date.now();
            }
            
            // Update game objects
            this.updateEnemies(deltaTime);
            this.updateBullets(deltaTime);
            this.checkCollisions();
            
            // Update physics
            if (this.world) {
                this.world.step(deltaTime);
            }
            
            // Update UI
            this.updateUI();
            
            // Check game over
            if (this.player && this.player.health <= 0) {
                this.gameOver();
            }
        }
        
        // Render - Make sure renderer exists
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        } else {
            console.error('Renderer, scene, or camera not initialized!');
        }
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Player class
class Player {
    constructor(scene, world, camera) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;
        this.health = 100;
        this.maxHealth = 100;
        this.currentAmmo = 30;
        this.maxAmmo = 30;
        this.totalAmmo = 120;
        this.reloadTime = 2000; // 2 seconds
        this.isReloading = false;
        this.lastShotTime = 0;
        this.fireRate = 100; // milliseconds between shots
        
        // Movement
        this.speed = 5;
        this.jumpForce = 10;
        this.isGrounded = false;
        
        // Physics body
        this.setupPhysics();
    }
    
    setupPhysics() {
        const shape = new CANNON.Sphere(0.5);
        this.body = new CANNON.Body({ mass: 1 });
        this.body.addShape(shape);
        this.body.position.set(0, 2, 0);
        this.body.fixedRotation = true;
        this.world.add(this.body);
    }
    
    update(deltaTime, keys, mouseX, mouseY) {
        // Update camera position to follow physics body
        this.camera.position.copy(this.body.position);
        this.camera.position.y += 0.5; // Eye height
        
        // Update camera rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = mouseX;
        this.camera.rotation.x = mouseY;
        
        // Movement
        const velocity = new CANNON.Vec3(0, 0, 0);
        
        if (keys['KeyW']) velocity.z -= 1;
        if (keys['KeyS']) velocity.z += 1;
        if (keys['KeyA']) velocity.x -= 1;
        if (keys['KeyD']) velocity.x += 1;
        
        if (velocity.length() > 0) {
            velocity.normalize();
            velocity.scale(this.speed, velocity);
            
            // Apply rotation to movement
            const rotatedVelocity = new CANNON.Vec3();
            rotatedVelocity.x = velocity.x * Math.cos(mouseX) - velocity.z * Math.sin(mouseX);
            rotatedVelocity.z = velocity.x * Math.sin(mouseX) + velocity.z * Math.cos(mouseX);
            rotatedVelocity.y = velocity.y;
            
            this.body.velocity.x = rotatedVelocity.x;
            this.body.velocity.z = rotatedVelocity.z;
        } else {
            this.body.velocity.x *= 0.8; // Friction
            this.body.velocity.z *= 0.8;
        }
        
        // Jumping
        if (keys['Space'] && this.isGrounded) {
            this.body.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
        
        // Ground detection
        this.isGrounded = this.body.position.y <= 1.1;
    }
    
    shoot() {
        if (this.isReloading || this.currentAmmo <= 0) return;
        if (Date.now() - this.lastShotTime < this.fireRate) return;
        
        this.currentAmmo--;
        this.lastShotTime = Date.now();
        
        // Create bullet
        const bullet = new Bullet(this.scene, this.world, this.camera);
        game.bullets.push(bullet);
        
        // Play sound
        if (game.sounds.shoot) game.sounds.shoot();
        
        // Muzzle flash
        this.showMuzzleFlash();
        
        // Auto-reload when empty
        if (this.currentAmmo === 0 && this.totalAmmo > 0) {
            this.reload();
        }
    }
    
    reload() {
        if (this.isReloading || this.currentAmmo === this.maxAmmo || this.totalAmmo === 0) return;
        
        this.isReloading = true;
        if (game.sounds.reload) game.sounds.reload();
        
        setTimeout(() => {
            const ammoNeeded = this.maxAmmo - this.currentAmmo;
            const ammoToReload = Math.min(ammoNeeded, this.totalAmmo);
            
            this.currentAmmo += ammoToReload;
            this.totalAmmo -= ammoToReload;
            this.isReloading = false;
        }, this.reloadTime);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.health = Math.max(0, this.health);
    }
    
    showMuzzleFlash() {
        const flash = document.createElement('div');
        flash.className = 'muzzle-flash';
        document.getElementById('gameUI').appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 100);
    }
    
    reset() {
        this.health = this.maxHealth;
        this.currentAmmo = this.maxAmmo;
        this.totalAmmo = 120;
        this.isReloading = false;
        this.body.position.set(0, 2, 0);
        this.body.velocity.set(0, 0, 0);
    }
}

// Bullet class
class Bullet {
    constructor(scene, world, camera) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;
        this.damage = 25;
        this.speed = 50;
        this.lifetime = 3000; // 3 seconds
        this.shouldDestroy = false;
        this.createdTime = Date.now();
        
        // Create bullet mesh
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.camera.position);
        this.scene.add(this.mesh);
        
        // Create physics body
        const shape = new CANNON.Sphere(0.05);
        this.body = new CANNON.Body({ mass: 0.1 });
        this.body.addShape(shape);
        this.body.position.copy(this.camera.position);
        
        // Set velocity based on camera direction
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        this.body.velocity.set(
            direction.x * this.speed,
            direction.y * this.speed,
            direction.z * this.speed
        );
        
        this.world.add(this.body);
    }
    
    update(deltaTime) {
        // Update mesh position
        this.mesh.position.copy(this.body.position);
        
        // Check lifetime
        if (Date.now() - this.createdTime > this.lifetime) {
            this.shouldDestroy = true;
        }
    }
    
    checkCollision(enemy) {
        const distance = this.mesh.position.distanceTo(enemy.mesh.position);
        return distance < 1.0; // Collision radius
    }
    
    destroy() {
        this.scene.remove(this.mesh);
        this.world.remove(this.body);
    }
}

// Enemy class
class Enemy {
    constructor(scene, world, x, y, z, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 2;
        this.damage = 10;
        this.attackRange = 2;
        this.attackCooldown = 1000; // 1 second
        this.lastAttackTime = 0;
        
        // Create enemy mesh
        const geometry = new THREE.ConeGeometry(0.5, 2, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y + 1, z);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        // Create physics body
        const shape = new CANNON.Cylinder(0.5, 0.5, 2, 8);
        this.body = new CANNON.Body({ mass: 1 });
        this.body.addShape(shape);
        this.body.position.set(x, y + 1, z);
        this.world.add(this.body);
    }
    
    update(deltaTime) {
        // Move towards player
        const direction = new THREE.Vector3();
        direction.subVectors(this.player.camera.position, this.mesh.position);
        direction.y = 0; // Don't move vertically
        direction.normalize();
        
        // Apply movement
        this.body.velocity.x = direction.x * this.speed;
        this.body.velocity.z = direction.z * this.speed;
        
        // Update mesh position
        this.mesh.position.copy(this.body.position);
        
        // Look at player
        this.mesh.lookAt(this.player.camera.position);
        
        // Attack if close enough
        const distance = this.mesh.position.distanceTo(this.player.camera.position);
        if (distance < this.attackRange && Date.now() - this.lastAttackTime > this.attackCooldown) {
            this.attack();
            this.lastAttackTime = Date.now();
        }
    }
    
    attack() {
        this.player.takeDamage(this.damage);
    }
    
    takeDamage(amount) {
        this.health -= amount;
    }
    
    checkPlayerCollision(player) {
        const distance = this.mesh.position.distanceTo(player.camera.position);
        return distance < 1.5;
    }
    
    destroy() {
        this.scene.remove(this.mesh);
        this.world.remove(this.body);
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    console.log('Page loaded, initializing FPS game...');
    try {
        game = new FPSGame();
        console.log('FPS game initialized successfully');
    } catch (error) {
        console.error('Error initializing FPS game:', error);
    }
});

// Also try to initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!game) {
        console.log('DOM ready, initializing FPS game...');
        try {
            game = new FPSGame();
            console.log('FPS game initialized successfully');
        } catch (error) {
            console.error('Error initializing FPS game:', error);
        }
    }
});
