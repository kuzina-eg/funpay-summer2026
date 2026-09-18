export default function initPcStory() {
    document.querySelectorAll('.pc-story__text').forEach(setupFade);

    const players = Array.from(document.querySelectorAll('[data-pc-audio]'));
    if (!players.length) return;

    const tracks = players.map(setupPlayer).filter(Boolean);
    const stopAll = () => tracks.forEach((track) => track.stop());

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-fancybox][href^="#"]');
        if (!link) return;

        const story = document.querySelector(link.getAttribute('href'));
        const track = tracks.find((item) => story && story.contains(item.audio));

        stopAll();
        if (track) track.start();
    });

    new MutationObserver((records) => {
        const closed = records.some((record) => Array.from(record.removedNodes).some(
            (node) => node.nodeType === 1 && node.classList.contains('fancybox__container'),
        ));

        if (closed) stopAll();
    }).observe(document.body, { childList: true });
}

function setupFade(text) {
    const sync = () => {
        const restBottom = text.scrollHeight - text.clientHeight - text.scrollTop;
        const restTop = text.scrollTop;

        text.classList.toggle('is-fading-bottom', restBottom > 1);
        text.classList.toggle('is-fading-top', restTop > 1);
    };

    text.addEventListener('scroll', sync, { passive: true });

    if (typeof ResizeObserver === 'function') {
        new ResizeObserver(sync).observe(text);
    } else {
        window.addEventListener('resize', sync);
        sync();
    }
}

function setupPlayer(box) {
    const audio = box.querySelector('[data-pc-audio-el]');
    const wave = box.querySelector('[data-pc-audio-wave]');
    const canvas = wave && wave.querySelector('canvas');
    const current = box.querySelector('[data-pc-audio-current]');
    const toggle = box.querySelector('[data-audio-toggle]');

    if (!audio || !canvas) return null;

    const peaks = (box.dataset.peaks || '').split(',').map(Number).filter((value) => value >= 0);
    if (!peaks.length) return null;

    const styles = getComputedStyle(box);
    const played = styles.getPropertyValue('--pc-wave-played').trim();
    const idle = styles.getPropertyValue('--pc-wave-idle').trim();

    const draw = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (!width || !height) return;

        const ratio = window.devicePixelRatio || 1;

        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);

        const context = canvas.getContext('2d');
        context.scale(ratio, ratio);

        const step = width / peaks.length;
        const bar = Math.max(1, step * .55);
        const progress = audio.duration ? audio.currentTime / audio.duration : 0;

        peaks.forEach((peak, index) => {
            const size = Math.max(bar, peak / 100 * height);

            context.fillStyle = (index + 1) / peaks.length <= progress ? played : idle;
            context.beginPath();

            if (context.roundRect) {
                context.roundRect(index * step, (height - size) / 2, bar, size, bar / 2);
                context.fill();
            } else {
                context.fillRect(index * step, (height - size) / 2, bar, size);
            }
        });
    };

    const showTime = () => {
        if (current) current.textContent = format(audio.currentTime);
    };

    audio.addEventListener('timeupdate', () => { draw(); showTime(); });
    audio.addEventListener('loadedmetadata', draw);
    audio.addEventListener('ended', () => { draw(); showTime(); });

    if (typeof ResizeObserver === 'function') {
        new ResizeObserver(draw).observe(canvas);
    } else {
        window.addEventListener('resize', draw);
    }

    wave.addEventListener('click', (event) => {
        if (event.detail === 0) {
            if (audio.paused) audio.play().catch(() => {});
            else audio.pause();
            return;
        }

        const box = wave.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));

        if (audio.duration) audio.currentTime = audio.duration * ratio;
        audio.play().catch(() => {});
    });

    if (audio && toggle) {
        const syncIcon = () => {
            toggle.classList.toggle('is-playing', !audio.paused);
            toggle.setAttribute('aria-label', audio.paused ? 'Play' : 'Pause');
        };

        toggle.addEventListener('click', () => {
            console.log('!!!!');
            if (audio.paused) audio.play();
            else audio.pause();
        });

        audio.addEventListener('play', syncIcon);
        audio.addEventListener('pause', syncIcon);
        audio.addEventListener('ended', syncIcon);

        syncIcon();
    }

    const play = () => audio.play().catch(() => {});

    return {
        audio,

        start() {
            play();
            requestAnimationFrame(() => requestAnimationFrame(() => {
                if (audio.paused) play();
                draw();
            }));
        },

        stop() {
            audio.pause();
            audio.currentTime = 0;
            showTime();
            draw();
        },
    };

}

function format(seconds) {
    const total = Math.floor(seconds || 0);
    const minutes = Math.floor(total / 60);

    return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}
