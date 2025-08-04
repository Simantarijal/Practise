// Minecraft Clone Game
class MinecraftGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
        
        if (!this.gl) {
            alert('WebGL not supported!');
            return;
        }
        
        this.setupCanvas();
        this.setupWebGL();
        this.setupControls();
        this.setupWorld();
        this.setupShaders();
        this.setupBuffers();
        this.setupTextures();
        
        this.gameState = {
            position: [0, 10, 0],
            rotation: [0, 0, 0],
            velocity: [0, 0, 0],
            onGround: false,
            selectedBlock: 'grass',
            inventory: ['grass', 'stone', 'wood', 'dirt', 'sand', 'water'],
            inventoryIndex: 0
        };
        
        this.world = new Map();
        this.chunkSize = 16;
        this.renderDistance = 4;
        
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        this.loadingProgress = 0;
        this.isLoading = true;
        
        this.init();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        });
    }
    
    setupWebGL() {
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.clearColor(0.5, 0.7, 1.0, 1.0);
    }
    
    setupControls() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, sensitivity: 0.002 };
        this.touchControls = {
            movement: { x: 0, y: 0 },
            look: { x: 0, y: 0 }
        };
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Block selection
            if (e.code >= 'Digit1' && e.code <= 'Digit6') {
                this.gameState.inventoryIndex = parseInt(e.code.slice(-1)) - 1;
                this.gameState.selectedBlock = this.gameState.inventory[this.gameState.inventoryIndex];
                this.updateInventorySelection();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === this.canvas) {
                this.gameState.rotation[0] -= e.movementY * this.mouse.sensitivity;
                this.gameState.rotation[1] -= e.movementX * this.mouse.sensitivity;
                
                // Clamp vertical rotation
                this.gameState.rotation[0] = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.gameState.rotation[0]));
            }
        });
        
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });
        
        // Mouse buttons
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.breakBlock();
            if (e.button === 2) this.placeBlock();
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Touch controls
        this.setupTouchControls();
        
        // Action buttons
        document.getElementById('jump-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['Space'] = true;
        });
        
        document.getElementById('jump-btn').addEventListener('touchend', () => {
            this.keys['Space'] = false;
        });
        
        document.getElementById('place-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.placeBlock();
        });
        
        document.getElementById('break-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.breakBlock();
        });
        
        // Inventory selection
        document.querySelectorAll('.inventory-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.gameState.inventoryIndex = index;
                this.gameState.selectedBlock = this.gameState.inventory[index];
                this.updateInventorySelection();
            });
        });
    }
    
    setupTouchControls() {
        // Movement joystick
        const movementJoystick = document.getElementById('movement-joystick');
        const movementThumb = movementJoystick.querySelector('.joystick-thumb');
        
        let movementActive = false;
        let movementStart = { x: 0, y: 0 };
        
        movementJoystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            movementActive = true;
            const touch = e.touches[0];
            const rect = movementJoystick.getBoundingClientRect();
            movementStart = {
                x: touch.clientX - rect.left - rect.width / 2,
                y: touch.clientY - rect.top - rect.height / 2
            };
        });
        
        movementJoystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!movementActive) return;
            
            const touch = e.touches[0];
            const rect = movementJoystick.getBoundingClientRect();
            const x = touch.clientX - rect.left - rect.width / 2;
            const y = touch.clientY - rect.top - rect.height / 2;
            
            const distance = Math.min(30, Math.sqrt(x * x + y * y));
            const angle = Math.atan2(y, x);
            
            const thumbX = Math.cos(angle) * distance;
            const thumbY = Math.sin(angle) * distance;
            
            movementThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;
            
            this.touchControls.movement.x = (x / 40) * Math.cos(angle);
            this.touchControls.movement.y = (y / 40) * Math.sin(angle);
        });
        
        movementJoystick.addEventListener('touchend', () => {
            movementActive = false;
            movementThumb.style.transform = 'translate(0, 0)';
            this.touchControls.movement.x = 0;
            this.touchControls.movement.y = 0;
        });
        
        // Look joystick
        const lookJoystick = document.getElementById('look-joystick');
        const lookThumb = lookJoystick.querySelector('.joystick-thumb');
        
        let lookActive = false;
        
        lookJoystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            lookActive = true;
        });
        
        lookJoystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!lookActive) return;
            
            const touch = e.touches[0];
            const rect = lookJoystick.getBoundingClientRect();
            const x = touch.clientX - rect.left - rect.width / 2;
            const y = touch.clientY - rect.top - rect.height / 2;
            
            const distance = Math.min(30, Math.sqrt(x * x + y * y));
            const angle = Math.atan2(y, x);
            
            const thumbX = Math.cos(angle) * distance;
            const thumbY = Math.sin(angle) * distance;
            
            lookThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;
            
            this.gameState.rotation[0] -= y * 0.01;
            this.gameState.rotation[1] -= x * 0.01;
            
            // Clamp vertical rotation
            this.gameState.rotation[0] = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.gameState.rotation[0]));
        });
        
        lookJoystick.addEventListener('touchend', () => {
            lookActive = false;
            lookThumb.style.transform = 'translate(0, 0)';
        });
    }
    
    setupWorld() {
        // Generate initial world
        this.generateChunks();
    }
    
    generateChunks() {
        const playerChunkX = Math.floor(this.gameState.position[0] / this.chunkSize);
        const playerChunkZ = Math.floor(this.gameState.position[2] / this.chunkSize);
        
        for (let x = playerChunkX - this.renderDistance; x <= playerChunkX + this.renderDistance; x++) {
            for (let z = playerChunkZ - this.renderDistance; z <= playerChunkZ + this.renderDistance; z++) {
                const chunkKey = `${x},${z}`;
                if (!this.world.has(chunkKey)) {
                    this.generateChunk(x, z);
                }
            }
        }
    }
    
    generateChunk(chunkX, chunkZ) {
        const chunk = new Map();
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldZ = chunkZ * this.chunkSize + z;
                
                // Simple height map generation
                const height = Math.floor(
                    Math.sin(worldX * 0.1) * 5 + 
                    Math.cos(worldZ * 0.1) * 5 + 
                    Math.sin(worldX * 0.05 + worldZ * 0.05) * 3 + 10
                );
                
                for (let y = 0; y < height; y++) {
                    let blockType = 'dirt';
                    if (y === height - 1) blockType = 'grass';
                    else if (y < height - 3) blockType = 'stone';
                    
                    const key = `${worldX},${y},${worldZ}`;
                    chunk.set(key, blockType);
                }
            }
        }
        
        this.world.set(`${chunkX},${chunkZ}`, chunk);
    }
    
    setupShaders() {
        const vertexShaderSource = `
            attribute vec3 a_position;
            attribute vec2 a_texCoord;
            attribute vec3 a_color;
            
            uniform mat4 u_modelViewMatrix;
            uniform mat4 u_projectionMatrix;
            
            varying vec2 v_texCoord;
            varying vec3 v_color;
            
            void main() {
                gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);
                v_texCoord = a_texCoord;
                v_color = a_color;
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            varying vec2 v_texCoord;
            varying vec3 v_color;
            
            uniform sampler2D u_texture;
            
            void main() {
                vec4 texColor = texture2D(u_texture, v_texCoord);
                gl_FragColor = vec4(v_color * texColor.rgb, texColor.a);
            }
        `;
        
        this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
        this.gl.useProgram(this.program);
        
        this.uniforms = {
            modelViewMatrix: this.gl.getUniformLocation(this.program, 'u_modelViewMatrix'),
            projectionMatrix: this.gl.getUniformLocation(this.program, 'u_projectionMatrix'),
            texture: this.gl.getUniformLocation(this.program, 'u_texture')
        };
        
        this.attributes = {
            position: this.gl.getAttribLocation(this.program, 'a_position'),
            texCoord: this.gl.getAttribLocation(this.program, 'a_texCoord'),
            color: this.gl.getAttribLocation(this.program, 'a_color')
        };
    }
    
    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
        }
        
        return program;
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
        }
        
        return shader;
    }
    
    setupBuffers() {
        // Create cube geometry
        const vertices = [
            // Front face
            -0.5, -0.5,  0.5,  0.0, 0.0,  1.0, 1.0, 1.0,
             0.5, -0.5,  0.5,  1.0, 0.0,  1.0, 1.0, 1.0,
             0.5,  0.5,  0.5,  1.0, 1.0,  1.0, 1.0, 1.0,
            -0.5,  0.5,  0.5,  0.0, 1.0,  1.0, 1.0, 1.0,
            
            // Back face
            -0.5, -0.5, -0.5,  1.0, 0.0,  1.0, 1.0, 1.0,
             0.5, -0.5, -0.5,  0.0, 0.0,  1.0, 1.0, 1.0,
             0.5,  0.5, -0.5,  0.0, 1.0,  1.0, 1.0, 1.0,
            -0.5,  0.5, -0.5,  1.0, 1.0,  1.0, 1.0, 1.0,
            
            // Top face
            -0.5,  0.5, -0.5,  0.0, 1.0,  1.0, 1.0, 1.0,
             0.5,  0.5, -0.5,  1.0, 1.0,  1.0, 1.0, 1.0,
             0.5,  0.5,  0.5,  1.0, 0.0,  1.0, 1.0, 1.0,
            -0.5,  0.5,  0.5,  0.0, 0.0,  1.0, 1.0, 1.0,
            
            // Bottom face
            -0.5, -0.5, -0.5,  1.0, 1.0,  1.0, 1.0, 1.0,
             0.5, -0.5, -0.5,  0.0, 1.0,  1.0, 1.0, 1.0,
             0.5, -0.5,  0.5,  0.0, 0.0,  1.0, 1.0, 1.0,
            -0.5, -0.5,  0.5,  1.0, 0.0,  1.0, 1.0, 1.0,
            
            // Right face
             0.5, -0.5, -0.5,  1.0, 0.0,  1.0, 1.0, 1.0,
             0.5,  0.5, -0.5,  1.0, 1.0,  1.0, 1.0, 1.0,
             0.5,  0.5,  0.5,  0.0, 1.0,  1.0, 1.0, 1.0,
             0.5, -0.5,  0.5,  0.0, 0.0,  1.0, 1.0, 1.0,
            
            // Left face
            -0.5, -0.5, -0.5,  0.0, 0.0,  1.0, 1.0, 1.0,
            -0.5,  0.5, -0.5,  0.0, 1.0,  1.0, 1.0, 1.0,
            -0.5,  0.5,  0.5,  1.0, 1.0,  1.0, 1.0, 1.0,
            -0.5, -0.5,  0.5,  1.0, 0.0,  1.0, 1.0, 1.0,
        ];
        
        const indices = [
            0,  1,  2,    0,  2,  3,   // front
            4,  5,  6,    4,  6,  7,   // back
            8,  9,  10,   8,  10, 11,  // top
            12, 13, 14,   12, 14, 15,  // bottom
            16, 17, 18,   16, 18, 19,  // right
            20, 21, 22,   20, 22, 23,  // left
        ];
        
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        
        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
        
        this.indexCount = indices.length;
    }
    
    setupTextures() {
        // Create a simple texture
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        
        // Create a simple checkerboard pattern
        const size = 64;
        const data = new Uint8Array(size * size * 4);
        for (let i = 0; i < size * size; i++) {
            const stride = i * 4;
            const x = i % size;
            const y = Math.floor(i / size);
            const checker = ((x >> 3) + (y >> 3)) % 2;
            const value = checker * 255;
            data[stride] = value;     // R
            data[stride + 1] = value; // G
            data[stride + 2] = value; // B
            data[stride + 3] = 255;   // A
        }
        
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, size, size, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    }
    
    init() {
        this.updateLoadingProgress(0.3);
        
        // Initialize inventory selection
        this.updateInventorySelection();
        
        this.updateLoadingProgress(0.6);
        
        // Start game loop
        this.updateLoadingProgress(1.0);
        setTimeout(() => {
            this.isLoading = false;
            document.getElementById('loading-screen').style.display = 'none';
            this.gameLoop();
        }, 1000);
    }
    
    updateLoadingProgress(progress) {
        this.loadingProgress = progress;
        document.querySelector('.loading-progress').style.width = (progress * 100) + '%';
    }
    
    updateInventorySelection() {
        document.querySelectorAll('.inventory-slot').forEach((slot, index) => {
            slot.classList.toggle('selected', index === this.gameState.inventoryIndex);
        });
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        // Update FPS counter
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate > 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
            document.getElementById('fps').textContent = this.fps;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        this.handleInput(deltaTime);
        this.updatePhysics(deltaTime);
        this.generateChunks();
    }
    
    handleInput(deltaTime) {
        const moveSpeed = 5.0;
        const jumpForce = 8.0;
        
        // Get movement direction
        let moveX = 0;
        let moveZ = 0;
        
        // Keyboard controls
        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;
        
        // Touch controls
        moveX += this.touchControls.movement.x;
        moveZ += this.touchControls.movement.y;
        
        // Normalize movement
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (length > 0) {
            moveX /= length;
            moveZ /= length;
        }
        
        // Apply movement
        const cosY = Math.cos(this.gameState.rotation[1]);
        const sinY = Math.sin(this.gameState.rotation[1]);
        
        this.gameState.velocity[0] = (moveX * cosY - moveZ * sinY) * moveSpeed;
        this.gameState.velocity[2] = (moveX * sinY + moveZ * cosY) * moveSpeed;
        
        // Jump
        if ((this.keys['Space'] || this.keys['KeyW']) && this.gameState.onGround) {
            this.gameState.velocity[1] = jumpForce;
            this.gameState.onGround = false;
        }
    }
    
    updatePhysics(deltaTime) {
        // Apply gravity
        this.gameState.velocity[1] -= 20.0 * deltaTime;
        
        // Update position
        this.gameState.position[0] += this.gameState.velocity[0] * deltaTime;
        this.gameState.position[1] += this.gameState.velocity[1] * deltaTime;
        this.gameState.position[2] += this.gameState.velocity[2] * deltaTime;
        
        // Simple collision detection
        const blockX = Math.floor(this.gameState.position[0]);
        const blockY = Math.floor(this.gameState.position[1]);
        const blockZ = Math.floor(this.gameState.position[2]);
        
        if (this.getBlock(blockX, blockY, blockZ)) {
            // Collision detected, move back
            this.gameState.position[1] = Math.ceil(this.gameState.position[1]);
            this.gameState.velocity[1] = 0;
            this.gameState.onGround = true;
        } else {
            this.gameState.onGround = false;
        }
        
        // Update position display
        document.getElementById('position').textContent = 
            `X: ${Math.floor(this.gameState.position[0])} Y: ${Math.floor(this.gameState.position[1])} Z: ${Math.floor(this.gameState.position[2])}`;
    }
    
    getBlock(x, y, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const chunkKey = `${chunkX},${chunkZ}`;
        
        const chunk = this.world.get(chunkKey);
        if (!chunk) return null;
        
        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const blockKey = `${localX},${y},${localZ}`;
        
        return chunk.get(blockKey);
    }
    
    setBlock(x, y, z, blockType) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const chunkKey = `${chunkX},${chunkZ}`;
        
        let chunk = this.world.get(chunkKey);
        if (!chunk) {
            chunk = new Map();
            this.world.set(chunkKey, chunk);
        }
        
        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const blockKey = `${localX},${y},${localZ}`;
        
        if (blockType) {
            chunk.set(blockKey, blockType);
        } else {
            chunk.delete(blockKey);
        }
    }
    
    breakBlock() {
        const raycast = this.raycast();
        if (raycast) {
            this.setBlock(raycast.x, raycast.y, raycast.z, null);
        }
    }
    
    placeBlock() {
        const raycast = this.raycast();
        if (raycast) {
            const x = raycast.x + raycast.normal[0];
            const y = raycast.y + raycast.normal[1];
            const z = raycast.z + raycast.normal[2];
            this.setBlock(x, y, z, this.gameState.selectedBlock);
        }
    }
    
    raycast() {
        const maxDistance = 5;
        const step = 0.1;
        
        let x = this.gameState.position[0];
        let y = this.gameState.position[1] + 1.6; // Eye height
        let z = this.gameState.position[2];
        
        const dx = Math.cos(this.gameState.rotation[1]) * Math.cos(this.gameState.rotation[0]);
        const dy = Math.sin(this.gameState.rotation[0]);
        const dz = Math.sin(this.gameState.rotation[1]) * Math.cos(this.gameState.rotation[0]);
        
        for (let distance = 0; distance < maxDistance; distance += step) {
            const blockX = Math.floor(x);
            const blockY = Math.floor(y);
            const blockZ = Math.floor(z);
            
            if (this.getBlock(blockX, blockY, blockZ)) {
                return {
                    x: blockX,
                    y: blockY,
                    z: blockZ,
                    normal: [
                        Math.floor(x - dx * step) - blockX,
                        Math.floor(y - dy * step) - blockY,
                        Math.floor(z - dz * step) - blockZ
                    ]
                };
            }
            
            x += dx * step;
            y += dy * step;
            z += dz * step;
        }
        
        return null;
    }
    
    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        // Set up matrices
        const aspect = this.canvas.width / this.canvas.height;
        const projectionMatrix = this.perspectiveMatrix(45 * Math.PI / 180, aspect, 0.1, 1000);
        
        const modelViewMatrix = this.createModelViewMatrix();
        
        // Set uniforms
        this.gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.uniforms.modelViewMatrix, false, modelViewMatrix);
        
        // Enable attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        
        this.gl.enableVertexAttribArray(this.attributes.position);
        this.gl.enableVertexAttribArray(this.attributes.texCoord);
        this.gl.enableVertexAttribArray(this.attributes.color);
        
        this.gl.vertexAttribPointer(this.attributes.position, 3, this.gl.FLOAT, false, 32, 0);
        this.gl.vertexAttribPointer(this.attributes.texCoord, 2, this.gl.FLOAT, false, 32, 12);
        this.gl.vertexAttribPointer(this.attributes.color, 3, this.gl.FLOAT, false, 32, 20);
        
        // Render blocks
        this.renderBlocks();
        
        // Disable attributes
        this.gl.disableVertexAttribArray(this.attributes.position);
        this.gl.disableVertexAttribArray(this.attributes.texCoord);
        this.gl.disableVertexAttribArray(this.attributes.color);
    }
    
    renderBlocks() {
        const playerChunkX = Math.floor(this.gameState.position[0] / this.chunkSize);
        const playerChunkZ = Math.floor(this.gameState.position[2] / this.chunkSize);
        
        for (let chunkX = playerChunkX - this.renderDistance; chunkX <= playerChunkX + this.renderDistance; chunkX++) {
            for (let chunkZ = playerChunkZ - this.renderDistance; chunkZ <= playerChunkZ + this.renderDistance; chunkZ++) {
                const chunkKey = `${chunkX},${chunkZ}`;
                const chunk = this.world.get(chunkKey);
                
                if (chunk) {
                    chunk.forEach((blockType, key) => {
                        const [x, y, z] = key.split(',').map(Number);
                        const worldX = chunkX * this.chunkSize + x;
                        const worldZ = chunkZ * this.chunkSize + z;
                        
                        this.renderBlock(worldX, y, worldZ, blockType);
                    });
                }
            }
        }
    }
    
    renderBlock(x, y, z, blockType) {
        const matrix = this.createModelViewMatrix();
        this.translateMatrix(matrix, x, y, z);
        
        this.gl.uniformMatrix4fv(this.uniforms.modelViewMatrix, false, matrix);
        this.gl.drawElements(this.gl.TRIANGLES, this.indexCount, this.gl.UNSIGNED_SHORT, 0);
    }
    
    createModelViewMatrix() {
        const matrix = new Float32Array(16);
        
        // Identity matrix
        matrix[0] = 1; matrix[4] = 0; matrix[8] = 0; matrix[12] = 0;
        matrix[1] = 0; matrix[5] = 1; matrix[9] = 0; matrix[13] = 0;
        matrix[2] = 0; matrix[6] = 0; matrix[10] = 1; matrix[14] = 0;
        matrix[3] = 0; matrix[7] = 0; matrix[11] = 0; matrix[15] = 1;
        
        // Apply rotation
        this.rotateMatrix(matrix, this.gameState.rotation[0], [1, 0, 0]);
        this.rotateMatrix(matrix, this.gameState.rotation[1], [0, 1, 0]);
        
        // Apply translation (negative for camera)
        this.translateMatrix(matrix, -this.gameState.position[0], -this.gameState.position[1], -this.gameState.position[2]);
        
        return matrix;
    }
    
    translateMatrix(matrix, x, y, z) {
        matrix[12] += matrix[0] * x + matrix[4] * y + matrix[8] * z;
        matrix[13] += matrix[1] * x + matrix[5] * y + matrix[9] * z;
        matrix[14] += matrix[2] * x + matrix[6] * y + matrix[10] * z;
        matrix[15] += matrix[3] * x + matrix[7] * y + matrix[11] * z;
    }
    
    rotateMatrix(matrix, angle, axis) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const omc = 1 - c;
        
        const x = axis[0], y = axis[1], z = axis[2];
        
        const rotationMatrix = new Float32Array([
            x * x * omc + c, x * y * omc - z * s, x * z * omc + y * s, 0,
            y * x * omc + z * s, y * y * omc + c, y * z * omc - x * s, 0,
            x * z * omc - y * s, y * z * omc + x * s, z * z * omc + c, 0,
            0, 0, 0, 1
        ]);
        
        this.multiplyMatrix(matrix, rotationMatrix);
    }
    
    multiplyMatrix(a, b) {
        const result = new Float32Array(16);
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] = 
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
        
        for (let i = 0; i < 16; i++) {
            a[i] = result[i];
        }
    }
    
    perspectiveMatrix(fov, aspect, near, far) {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1.0 / (near - far);
        
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new MinecraftGame();
});