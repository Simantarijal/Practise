class MinecraftGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.world = {};
        this.blocks = [];
        this.selectedBlock = 'grass';
        this.hands = null;
        this.camera = null;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.isPointerLocked = false;
        
        this.blockTypes = {
            grass: { color: 0x7CB342, texture: '🌱' },
            stone: { color: 0x757575, texture: '🪨' },
            wood: { color: 0x8D6E63, texture: '🪵' },
            sand: { color: 0xFDD835, texture: '🏖️' },
            water: { color: 0x2196F3, texture: '💧' }
        };
        
        this.init();
    }
    
    async init() {
        this.setupLoading();
        await this.setupThreeJS();
        this.setupPlayer();
        this.generateWorld();
        this.setupControls();
        this.setupHandControls();
        this.setupMobileControls();
        this.setupUI();
        this.hideLoading();
        this.animate();
    }
    
    setupLoading() {
        const progress = document.querySelector('.loading-progress');
        let width = 0;
        const interval = setInterval(() => {
            width += Math.random() * 15;
            if (width >= 100) {
                width = 100;
                clearInterval(interval);
            }
            progress.style.width = width + '%';
        }, 100);
    }
    
    async setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('game-canvas'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Fog
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupPlayer() {
        this.player = {
            position: new THREE.Vector3(0, 10, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
            onGround: false,
            height: 1.8,
            speed: 0.1,
            jumpSpeed: 0.3,
            gravity: 0.015
        };
        
        this.camera.position.copy(this.player.position);
        this.camera.position.y += this.player.height;
    }
    
    generateWorld() {
        const size = 50;
        const height = 8;
        
        // Generate terrain
        for (let x = -size; x < size; x++) {
            for (let z = -size; z < size; z++) {
                const distance = Math.sqrt(x * x + z * z);
                const heightValue = Math.max(0, Math.floor(height * (1 - distance / size) + Math.random() * 2));
                
                for (let y = 0; y < heightValue; y++) {
                    let blockType = 'grass';
                    if (y === 0) blockType = 'stone';
                    else if (y < heightValue - 1) blockType = 'stone';
                    else if (Math.random() < 0.1) blockType = 'sand';
                    
                    this.placeBlock(x, y, z, blockType);
                }
                
                // Add some water
                if (distance > size * 0.8 && Math.random() < 0.3) {
                    this.placeBlock(x, 0, z, 'water');
                }
            }
        }
        
        // Add some trees
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * size * 1.5;
            const z = (Math.random() - 0.5) * size * 1.5;
            const y = this.getHeightAt(x, z);
            
            if (y > 0) {
                this.generateTree(x, y, z);
            }
        }
    }
    
    generateTree(x, y, z) {
        // Tree trunk
        for (let i = 0; i < 4; i++) {
            this.placeBlock(x, y + i, z, 'wood');
        }
        
        // Tree leaves
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                for (let dy = 0; dy <= 2; dy++) {
                    if (Math.random() < 0.7) {
                        this.placeBlock(x + dx, y + 4 + dy, z + dz, 'grass');
                    }
                }
            }
        }
    }
    
    getHeightAt(x, z) {
        const key = `${Math.floor(x)},${Math.floor(z)}`;
        if (this.world[key]) {
            return Math.max(...this.world[key].map(block => block.y));
        }
        return 0;
    }
    
    placeBlock(x, y, z, type) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ 
            color: this.blockTypes[type].color 
        });
        
        const block = new THREE.Mesh(geometry, material);
        block.position.set(x, y, z);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData = { type, x, y, z };
        
        this.scene.add(block);
        this.blocks.push(block);
        
        const key = `${x},${z}`;
        if (!this.world[key]) this.world[key] = [];
        this.world[key].push({ x, y, z, type, mesh: block });
    }
    
    removeBlock(x, y, z) {
        const key = `${x},${z}`;
        if (this.world[key]) {
            const blockIndex = this.world[key].findIndex(block => 
                block.x === x && block.y === y && block.z === z
            );
            
            if (blockIndex !== -1) {
                const block = this.world[key][blockIndex];
                this.scene.remove(block.mesh);
                this.world[key].splice(blockIndex, 1);
                
                const globalIndex = this.blocks.indexOf(block.mesh);
                if (globalIndex !== -1) {
                    this.blocks.splice(globalIndex, 1);
                }
            }
        }
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
                this.jump();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse controls
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.mouseX += e.movementX * 0.002;
                this.mouseY += e.movementY * 0.002;
                this.mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouseY));
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!this.isPointerLocked) {
                document.body.requestPointerLock();
                this.isPointerLocked = true;
            } else {
                this.handleClick(e);
            }
        });
        
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement !== null;
        });
    }
    
    async setupHandControls() {
        if (!this.isMobile) {
            try {
                const video = document.createElement('video');
                video.style.display = 'none';
                document.body.appendChild(video);
                
                this.hands = new Hands({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                    }
                });
                
                this.hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
                
                this.hands.onResults((results) => {
                    this.handleHandResults(results);
                });
                
                const camera = new Camera(video, {
                    onFrame: async () => {
                        await this.hands.send({ image: video });
                    },
                    width: 640,
                    height: 480
                });
                
                camera.start();
            } catch (error) {
                console.log('Hand controls not available:', error);
            }
        }
    }
    
    setupMobileControls() {
        if (this.isMobile) {
            // Device orientation
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', (e) => {
                    if (e.beta && e.gamma) {
                        this.mouseX += e.gamma * 0.01;
                        this.mouseY += e.beta * 0.01;
                        this.mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouseY));
                    }
                });
            }
            
            // Touch controls
            let touchStartTime = 0;
            let touchStartX = 0;
            let touchStartY = 0;
            
            document.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            });
            
            document.addEventListener('touchend', (e) => {
                const touchEndTime = Date.now();
                const touchDuration = touchEndTime - touchStartTime;
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const distance = Math.sqrt(
                    Math.pow(touchEndX - touchStartX, 2) + 
                    Math.pow(touchEndY - touchStartY, 2)
                );
                
                if (touchDuration < 200 && distance < 10) {
                    this.handleClick(e);
                }
            });
            
            // Shake detection for jump
            let lastTime = 0;
            let lastX = 0;
            let lastY = 0;
            let lastZ = 0;
            
            window.addEventListener('devicemotion', (e) => {
                const currentTime = new Date().getTime();
                if (currentTime - lastTime > 100) {
                    const diffTime = currentTime - lastTime;
                    lastTime = currentTime;
                    
                    const x = e.accelerationIncludingGravity.x;
                    const y = e.accelerationIncludingGravity.y;
                    const z = e.accelerationIncludingGravity.z;
                    
                    const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;
                    
                    if (speed > 800) {
                        this.jump();
                    }
                    
                    lastX = x;
                    lastY = y;
                    lastZ = z;
                }
            });
        }
    }
    
    handleHandResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Calculate hand gestures
            const indexFinger = landmarks[8];
            const middleFinger = landmarks[12];
            const ringFinger = landmarks[16];
            const pinkyFinger = landmarks[20];
            const thumb = landmarks[4];
            
            // Point finger to look around
            if (indexFinger.y < landmarks[6].y) {
                this.mouseX += (indexFinger.x - 0.5) * 0.1;
                this.mouseY += (indexFinger.y - 0.5) * 0.1;
                this.mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouseY));
            }
            
            // Fist to move forward
            const isFist = this.isFist(landmarks);
            if (isFist) {
                this.keys['KeyW'] = true;
            } else {
                this.keys['KeyW'] = false;
            }
            
            // Open palm to place block
            const isOpenPalm = this.isOpenPalm(landmarks);
            if (isOpenPalm) {
                this.handleClick({});
            }
            
            // Pinch to destroy block
            const isPinch = this.isPinch(landmarks);
            if (isPinch) {
                this.handleRightClick({});
            }
        }
    }
    
    isFist(landmarks) {
        const fingerTips = [8, 12, 16, 20];
        const fingerBases = [6, 10, 14, 18];
        
        return fingerTips.every((tip, i) => 
            landmarks[tip].y > landmarks[fingerBases[i]].y
        );
    }
    
    isOpenPalm(landmarks) {
        const fingerTips = [8, 12, 16, 20];
        const fingerBases = [6, 10, 14, 18];
        
        return fingerTips.every((tip, i) => 
            landmarks[tip].y < landmarks[fingerBases[i]].y
        );
    }
    
    isPinch(landmarks) {
        const thumb = landmarks[4];
        const index = landmarks[8];
        const distance = Math.sqrt(
            Math.pow(thumb.x - index.x, 2) + 
            Math.pow(thumb.y - index.y, 2)
        );
        
        return distance < 0.1;
    }
    
    setupUI() {
        // Block selector
        document.querySelectorAll('.block-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.block-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                this.selectedBlock = option.dataset.block;
            });
        });
        
        // Hide controls info after 10 seconds
        setTimeout(() => {
            document.getElementById('controls-info').classList.add('controls-hidden');
        }, 10000);
        
        // Add crosshair
        const crosshair = document.createElement('div');
        crosshair.className = 'crosshair';
        document.getElementById('ui-overlay').appendChild(crosshair);
    }
    
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
    
    handleClick(e) {
        e.preventDefault();
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(0, 0);
        
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.blocks);
        
        if (intersects.length > 0) {
            const intersect = intersects[0];
            const block = intersect.object;
            const position = block.position.clone();
            
            // Place block in front of the clicked face
            const normal = intersect.face.normal;
            position.add(normal);
            
            this.placeBlock(
                Math.round(position.x),
                Math.round(position.y),
                Math.round(position.z),
                this.selectedBlock
            );
        }
    }
    
    handleRightClick(e) {
        e.preventDefault();
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(0, 0);
        
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.blocks);
        
        if (intersects.length > 0) {
            const intersect = intersects[0];
            const block = intersect.object;
            
            this.removeBlock(
                Math.round(block.position.x),
                Math.round(block.position.y),
                Math.round(block.position.z)
            );
        }
    }
    
    jump() {
        if (this.player.onGround) {
            this.player.velocity.y = this.player.jumpSpeed;
            this.player.onGround = false;
        }
    }
    
    updatePlayer() {
        // Handle keyboard input
        const moveSpeed = this.player.speed;
        const direction = new THREE.Vector3();
        
        if (this.keys['KeyW']) direction.z -= 1;
        if (this.keys['KeyS']) direction.z += 1;
        if (this.keys['KeyA']) direction.x -= 1;
        if (this.keys['KeyD']) direction.x += 1;
        
        direction.normalize();
        
        // Apply camera rotation to movement
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        cameraDirection.applyQuaternion(this.camera.quaternion);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        const right = new THREE.Vector3();
        right.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
        
        const moveVector = new THREE.Vector3();
        if (direction.z !== 0) moveVector.add(cameraDirection.clone().multiplyScalar(direction.z));
        if (direction.x !== 0) moveVector.add(right.clone().multiplyScalar(direction.x));
        
        this.player.position.add(moveVector.multiplyScalar(moveSpeed));
        
        // Apply gravity
        this.player.velocity.y -= this.player.gravity;
        this.player.position.y += this.player.velocity.y;
        
        // Ground collision
        const groundHeight = this.getHeightAt(this.player.position.x, this.player.position.z) + 1;
        if (this.player.position.y <= groundHeight) {
            this.player.position.y = groundHeight;
            this.player.velocity.y = 0;
            this.player.onGround = true;
        }
        
        // Update camera position
        this.camera.position.copy(this.player.position);
        this.camera.position.y += this.player.height;
        
        // Apply mouse rotation
        this.camera.rotation.x = this.mouseY;
        this.camera.rotation.y = this.mouseX;
        
        // Update UI
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('pos-x').textContent = Math.round(this.player.position.x);
        document.getElementById('pos-y').textContent = Math.round(this.player.position.y);
        document.getElementById('pos-z').textContent = Math.round(this.player.position.z);
        document.getElementById('block-count').textContent = this.blocks.length;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updatePlayer();
        this.renderer.render(this.scene, this.camera);
        
        // Update FPS counter
        const now = performance.now();
        if (!this.lastTime) this.lastTime = now;
        const fps = Math.round(1000 / (now - this.lastTime));
        document.getElementById('fps-counter').textContent = fps;
        this.lastTime = now;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new MinecraftGame();
});