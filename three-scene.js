/**
 * Dự án: Quà tặng Quốc tế Thiếu nhi 1/6 cho Ebe Thùy Linh 💖
 * Module: Hệ thống đồ họa Three.js (Mưa Hoa Anh Đào & Pháo Hoa Cinematic)
 * File: three-scene.js
 * Chức năng: Quản lý không gian 3D, tạo hiệu ứng hạt hoa anh đào rơi tự nhiên
 * và hệ thống pháo hoa nổ rực rỡ khi kích hoạt.
 */

// --- Biến toàn cục hệ thống ---
let scene, camera, renderer;
let sakuraParticleSystem;
const sakuraCount = 250; // Số lượng cánh hoa đào rơi cùng lúc
const fireworksArray = []; // Mảng quản lý các chùm pháo hoa

// Cấu hình thông số kỹ thuật cho hạt hoa anh đào
let sakuraPositions, sakuraVelocities, sakuraRotations;

// Khởi tạo không gian 3D ngay khi file được tải
initThreeEngine();
animateScene();

/**
 * 1. KHỞI TẠO ENGINE THREE.JS
 */
function initThreeEngine() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    // Tạo Scene (Không gian)
    scene = new THREE.Scene();
    // Tạo sương mù nhẹ phía xa để tạo chiều sâu không gian huyền ảo
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.015);

    // Tạo Camera (Góc nhìn)
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Tạo Renderer (Bộ dựng hình tối ưu)
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true // Cho phép nền trong suốt để phối hợp với CSS background
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Tối ưu hiệu năng màn hình Retina

    // Thêm ánh sáng môi trường dịu nhẹ
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Khởi tạo các hệ thống hạt hiệu ứng
    createSakuraStorm();

    // Lắng nghe sự kiện đổi kích thước màn hình (Responsive)
    window.addEventListener('resize', onWindowResize);
}

/**
 * 2. TẠO TEXTURE TỰ ĐỘNG BẰNG CANVAS TRONG SUỐT (Procedural Textures)
 * Giúp dự án chạy độc lập không cần tải thêm file ảnh bên ngoài, tránh lỗi CORS.
 */
function generateSakuraTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Vẽ hình dáng cánh hoa anh đào mềm mại mềm mại
    ctx.fillStyle = 'rgba(255, 182, 193, 0.95)'; // Màu hồng phấn ebe ngọt ngào
    ctx.beginPath();
    ctx.moveTo(32, 12);
    ctx.bezierCurveTo(32, 2, 12, 2, 12, 24);
    ctx.bezierCurveTo(12, 44, 32, 54, 32, 60);
    ctx.bezierCurveTo(32, 54, 52, 44, 52, 24);
    ctx.bezierCurveTo(52, 2, 32, 2, 32, 12);
    ctx.closePath();
    ctx.fill();

    // Thêm chút điểm nhấn nhị hoa mờ nhẹ ở giữa
    const gradient = ctx.createRadialGradient(32, 24, 0, 32, 24, 15);
    gradient.addColorStop(0, 'rgba(255, 105, 180, 1)'); // Hồng đậm hơn ở tâm
    gradient.addColorStop(1, 'rgba(255, 182, 193, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

function generateSparkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Tạo điểm sáng hạt pháo hoa phát quang hạt tâm (Radial Glow)
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 200, 100, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 50, 50, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    return new THREE.CanvasTexture(canvas);
}

/**
 * 3. HỆ THỐNG HẠT MƯA HOA ANH ĐÀO (SAKURA STORM)
 */
function createSakuraStorm() {
    const sakuraGeometry = new THREE.BufferGeometry();
    sakuraPositions = new Float32Array(sakuraCount * 3);
    sakuraVelocities = [];
    sakuraRotations = [];

    for (let i = 0; i < sakuraCount; i++) {
        // Phân tán vị trí ngẫu nhiên trong không gian hộp trước camera
        sakuraPositions[i * 3] = (Math.random() - 0.5) * 60;     // X
        sakuraPositions[i * 3 + 1] = Math.random() * 40 - 20;     // Y (độ cao)
        sakuraPositions[i * 3 + 2] = (Math.random() - 0.5) * 40; // Z

        // Tốc độ rơi, lắc lư ngẫu nhiên tạo độ chân thực
        sakuraVelocities.push({
            y: 0.05 + Math.random() * 0.05, // Tốc độ rơi xuống
            x: (Math.random() - 0.5) * 0.03, // Tốc độ dạt ngang gió thổi
            z: (Math.random() - 0.5) * 0.02,
            swaySpeed: 1 + Math.random() * 2, // Tốc độ lắc lư qua lại
            swayValue: Math.random() * 100
        });

        // Góc xoay tự thân của cánh hoa
        sakuraRotations.push({
            x: Math.random() * Math.PI,
            y: Math.random() * Math.PI,
            z: Math.random() * Math.PI,
            speedX: (Math.random() - 0.5) * 0.02,
            speedY: (Math.random() - 0.5) * 0.02
        });
    }

    sakuraGeometry.setAttribute('position', new THREE.BufferAttribute(sakuraPositions, 3));

    // Khởi tạo vật liệu hạt sử dụng texture bông hoa anh đào tự vẽ
    const sakuraMaterial = new THREE.PointsMaterial({
        size: 0.8,
        map: generateSakuraTexture(),
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false // Ngăn lỗi viền đen khi các hạt xếp đè lên nhau
    });

    sakuraParticleSystem = new THREE.Points(sakuraGeometry, sakuraMaterial);
    scene.add(sakuraParticleSystem);
}

/**
 * Cập nhật động lực học cho hoa anh đào rơi sinh động
 */
function updateSakura() {
    if (!sakuraParticleSystem) return;

    const positions = sakuraParticleSystem.geometry.attributes.position.array;

    for (let i = 0; i < sakuraCount; i++) {
        const vel = sakuraVelocities[i];
        vel.swayValue += 0.01 * vel.swaySpeed;

        // Áp dụng chuyển động rơi và chuyển động hình sin lắc lư theo chiều gió
        positions[i * 3] += vel.x + Math.sin(vel.swayValue) * 0.01;
        positions[i * 3 + 1] -= vel.y;
        positions[i * 3 + 2] += vel.z;

        // Nếu cánh hoa rơi vượt quá đáy màn hình, reset đưa trở lại đỉnh để rơi tiếp tục vòng lặp
        if (positions[i * 3 + 1] < -25) {
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = 25;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
    }

    // Thông báo cho Three.js cập nhật lại tọa độ mới lên GPU GPU
    sakuraParticleSystem.geometry.attributes.position.needsUpdate = true;
}

/**
 * 4. CLASS ĐỐI TƯỢNG PHÁO HOA CỰC ĐẸP (FIREWORK OBJECT)
 */
class FireworkExplosion {
    constructor(targetX, targetY, targetZ, colorHex) {
        this.particleCount = 120;
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        this.velocities = [];
        this.opacity = 1.0;
        this.fadeSpeed = 0.012 + Math.random() * 0.008; // Tốc độ tàn của pháo hoa

        // Điểm phát nổ trung tâm trung tâm
        for (let i = 0; i < this.particleCount; i++) {
            this.positions[i * 3] = targetX;
            this.positions[i * 3 + 1] = targetY;
            this.positions[i * 3 + 2] = targetZ;

            // Tính toán vận tốc theo mọi hướng trong không gian quả cầu (Spherical Distribution)
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const speed = 0.15 + Math.random() * 0.25; // Sức mạnh vụ nổ lực đẩy

            this.velocities.push({
                x: speed * Math.sin(phi) * Math.cos(theta),
                y: speed * Math.sin(phi) * Math.sin(theta),
                z: speed * Math.cos(phi)
            });
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

        // Vật liệu phát quang cho pháo hoa nổ rực rỡ rực rỡ
        this.material = new THREE.PointsMaterial({
            size: 0.6,
            map: generateSparkTexture(),
            transparent: true,
            blending: THREE.AdditiveBlending, // Hiệu ứng cộng sáng siêu rực rỡ
            depthWrite: false,
            color: colorHex
        });

        this.points = new THREE.Points(this.geometry, this.material);
        scene.add(this.points);
    }

    update() {
        if (this.opacity <= 0) return false;

        const positions = this.geometry.attributes.position.array;
        this.opacity -= this.fadeSpeed;
        this.material.opacity = this.opacity;

        for (let i = 0; i < this.particleCount; i++) {
            const v = this.velocities[i];
            
            // Hạt pháo dạt ra xa tâm vụ nổ
            positions[i * 3] += v.x;
            positions[i * 3 + 1] += v.y;
            positions[i * 3 + 2] += v.z;

            // Chịu thêm tác động của trọng lực nhẹ khiến pháo hoa rơi rụng xuống đất quyến rũ
            v.y -= 0.005;
            // Áp dụng lực cản không khí nhẹ để hạt pháo hãm tốc độ từ từ
            v.x *= 0.98;
            v.y *= 0.98;
            v.z *= 0.98;
        }

        this.geometry.attributes.position.needsUpdate = true;
        return true; // Pháo hoa vẫn đang hiển thị hiển thị
    }

    destroy() {
        scene.remove(this.points);
        this.geometry.dispose();
        this.material.dispose();
    }
}

/**
 * 5. HÀM KÍCH HOẠT CHUỖI PHÁO HOA (TRIGGER FIREWORKS)
 * Hàm này sẽ được gọi từ file main.js khi Ebe Linh ấn nút khởi đầu cuộc hành trình.
 */
function triggerFireworks() {
    const colors = [
        0xff69b4, // Hồng đậm quyến rũ
        0xffb6c1, // Hồng đào ebe ebe
        0xffd700, // Vàng hoàng kim lấp lánh
        0x00ffff, // Xanh ngọc lam dịu mát
        0xffa500  // Cam ấm áp hân hoan
    ];

    // Tạo loạt phát súng nổ liên hoàn ngẫu nhiên trên bầu trời ảo ảo
    let delay = 0;
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            const randomX = (Math.random() - 0.5) * 40;
            const randomY = Math.random() * 15; // Nổ ở tầm trung và cao cao
            const randomZ = (Math.random() - 0.5) * 20;
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            fireworksArray.push(new FireworkExplosion(randomX, randomY, randomZ, randomColor));
        }, delay);
        delay += 350; // Khoảng cách thời gian giữa các phát nổ nổ liên hoàn
    }
}

/**
 * 6. VÒNG LẶP RENDER HOẠT HÌNH (ANIMATION LOOP LOOP)
 * Chạy liên tục với tần số quét của màn hình điện thoại/máy tính tính.
 */
function animateScene() {
    requestAnimationFrame(animateScene);

    // Cập nhật các cánh hoa rơi tự nhiên
    updateSakura();

    // Duyệt qua và cập nhật trạng thái hoạt động của từng chùm pháo hoa hoa
    for (let i = fireworksArray.length - 1; i >= 0; i--) {
        const isAlive = fireworksArray[i].update();
        if (!isAlive) {
            fireworksArray[i].destroy(); // Giải phóng bộ nhớ RAM RAM tránh rò rỉ bộ nhớ
            fireworksArray.splice(i, 1);
        }
    }

    // Tiến hành vẽ render khung hình mới
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

/**
 * 7. ĐẢM BẢO ĐÁP ỨNG KÍCH THƯỚC MÀN HÌNH (RESPONSIVE EVENT)
 */
function onWindowResize() {
    if (!camera || !renderer) return;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
