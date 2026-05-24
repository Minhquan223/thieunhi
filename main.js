gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. CUSTOM CURSOR
// ==========================================
const cursor = document.querySelector('.cursor-heart');
if (cursor) {
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
}

// ==========================================
// 2. LOADING SCREEN & TERMINAL CTF
// ==========================================
const termOverlay = document.getElementById('terminal-overlay');
const termInput = document.getElementById('term-input');
const termResponse = document.getElementById('term-response');

window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.style.opacity = '0';
        
        setTimeout(() => {
            if (loader) loader.style.display = 'none';
            
            // Kích hoạt Terminal chặn cửa
            if (termOverlay && termInput) {
                termOverlay.classList.add('active');
                setTimeout(() => termInput.focus(), 100); 
            } else {
                // Nếu lỡ quên chèn HTML của terminal thì tự nhảy vào web luôn
                playIntro();
            }
        }, 1000);
    }, 1500);
});

// Xử lý nút tắt khẩn cấp Terminal
const closeTermBtn = document.getElementById('close-terminal');
if (closeTermBtn) {
    closeTermBtn.addEventListener('click', () => {
        termOverlay.classList.remove('active');
        playIntro(); 
    });
}

// Xử lý khi nhập Mật khẩu
if (termInput) {
    termInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const val = termInput.value.trim().toLowerCase();
            termResponse.style.display = 'block';
            
            if (val === 'linh thúi' || val === 'linh nâu' || val === 'ebe cua' || val === 'thùy linh thúi' ) { 
                termResponse.innerHTML = "[✓] Decode thành công! Đang cấp quyền truy cập hệ thống...";
                termResponse.style.color = '#ffb6c1';
                termInput.disabled = true; 
                
                setTimeout(() => {
                    termOverlay.classList.remove('active');
                    termOverlay.style.display = 'none'; 
                    playIntro(); 
                }, 1500);
                
            } else {
                termResponse.innerHTML = "[x] Truy cập bị từ chối. Thuật toán báo sai pass rồi nha!";
                termResponse.style.color = '#ff5555';
                
                termOverlay.style.transform = "translateX(10px)";
                setTimeout(() => termOverlay.style.transform = "translateX(-10px)", 50);
                setTimeout(() => termOverlay.style.transform = "translateX(0)", 100);
            }
            termInput.value = ''; 
        }
    });
}

// ==========================================
// 3. INTRO CINEMATIC & BẮT ĐẦU
// ==========================================
function playIntro() {
    const tl = gsap.timeline();
    tl.to('.text-line', { opacity: 1, y: -20, duration: 1.5, stagger: 1, ease: 'power2.out' })
      .to('#start-btn', { opacity: 1, y: -10, duration: 1 });
}

const startBtn = document.getElementById('start-btn');
if (startBtn) {
    startBtn.addEventListener('click', () => {
        const bgm = document.getElementById('bgm');
        if (bgm) bgm.play();

        gsap.to('#intro', { opacity: 0, duration: 1, onComplete: () => {
            document.getElementById('intro').style.display = 'none';
            const mainContent = document.getElementById('main-content');
            if (mainContent) mainContent.style.display = 'block';
            
            if(typeof triggerFireworks === "function") triggerFireworks();
            
            initParallax(); // Khởi chạy các hiệu ứng cuộn
        }});
    });
}

// ==========================================
// 4. MODULES NỘI DUNG (PARALLAX, GALLERY, THƯ 3D)
// ==========================================
function initParallax() {
    gsap.from('.gsap-title', {
        scrollTrigger: { trigger: '#section-1', start: 'top 80%' },
        y: 100, opacity: 0, duration: 1.5
    });

    initGalleryParallax(); 
    init3DLetter();
}

function initGalleryParallax() {
    const items = document.querySelectorAll('.parallax-item');
    items.forEach(item => {
        const speed = parseFloat(item.getAttribute('data-speed')) || 1;
        gsap.to(item, {
            y: (i, target) => -150 * speed,
            ease: "none",
            scrollTrigger: {
                trigger: ".parallax-gallery",
                start: "top bottom",
                end: "bottom top",
                scrub: 1.5
            }
        });

        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (img) openViewer(img.src);
        });
    });
}

// Fullscreen Viewer
const viewer = document.getElementById('image-viewer');
const viewerImg = document.getElementById('viewer-img');
const closeBtn = document.getElementById('close-viewer');

function openViewer(src) {
    if (!viewer || !viewerImg) return;
    viewerImg.src = src;
    viewer.classList.add('active');
    gsap.to(viewer, { opacity: 1, duration: 0.3 });
    gsap.to(viewerImg, { scale: 1, duration: 0.6, ease: "back.out(1.5)" });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        gsap.to(viewerImg, { scale: 0.8, duration: 0.3 });
        gsap.to(viewer, { opacity: 0, duration: 0.3, onComplete: () => {
            viewer.classList.remove('active');
        }});
    });
}

function init3DLetter() {
    const envelope = document.querySelector('.envelope-wrapper');
    const indicator = document.querySelector('.click-indicator');
    if (!envelope) return;

    gsap.from(envelope, {
        scrollTrigger: { trigger: "#section-2", start: "top 60%" },
        y: 300, opacity: 0, rotationZ: -15, rotationX: 45, duration: 1.5, ease: "power3.out",
        onComplete: () => envelope.classList.add('floating')
    });

    envelope.addEventListener('click', () => {
        envelope.classList.toggle('open');
        if(indicator) indicator.style.opacity = '0';

        if (envelope.classList.contains('open')) {
            envelope.classList.remove('floating');
        } else {
            setTimeout(() => envelope.classList.add('floating'), 1000);
        }
    });
}

// ==========================================
// 5. LOVE TIMER (ĐẾM NGÀY YÊU)
// ==========================================
const startDate = new Date(2026, 0, 9).getTime(); // Đổi lại ngày kỷ niệm của hai bạn vào đây nhé
function updateLoveTimer() {
    const lDays = document.getElementById("l-days");
    if (!lDays) return;

    const now = new Date().getTime();
    const distance = now - startDate;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    lDays.innerText = days;
    document.getElementById("l-hours").innerText = hours.toString().padStart(2, '0');
    document.getElementById("l-mins").innerText = minutes.toString().padStart(2, '0');
    document.getElementById("l-secs").innerText = seconds.toString().padStart(2, '0');
}
setInterval(updateLoveTimer, 1000);
updateLoveTimer();

// ==========================================
// 6. DARKROOM (PHÒNG TỐI)
// ==========================================
const darkroom = document.querySelector('.darkroom-container');
if (darkroom) {
    darkroom.addEventListener('mousemove', (e) => {
        const rect = darkroom.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const mask = darkroom.querySelector('.darkroom-mask');
        if (mask) {
            mask.style.setProperty('--x', `${x}px`);
            mask.style.setProperty('--y', `${y}px`);
        }
    });
}
