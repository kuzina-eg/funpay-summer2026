/*
      [data-carousel]           — контейнер
        [data-carousel-track]   — прокручиваемый трек со слайдами
        [data-carousel-prev]    — кнопка «назад» (опц.)
        [data-carousel-next]    — кнопка «вперёд» (опц.)
      [data-carousel-loop]      — бесконечная прокрутка по кругу (опц.)
*/

export default function initCarousel() {
    document.querySelectorAll('[data-carousel]').forEach(setupCarousel);
}

function setupCarousel(carousel) {
    const track = carousel.querySelector('[data-carousel-track]');
    if (!track) return;

    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    const loop = carousel.hasAttribute('data-carousel-loop');

    const getStep = () => {
        const first = track.firstElementChild;
        if (!first) return track.clientWidth;
        const styles = getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap) || 0;
        return first.getBoundingClientRect().width + gap;
    };

    if (loop && track.children.length > 1) {
        setupLoop(carousel, track, prevBtn, nextBtn, getStep);
    } else {
        setupLinear(carousel, track, prevBtn, nextBtn, getStep);
    }

    setupDrag(track);
}

function setupLinear(carousel, track, prevBtn, nextBtn, getStep) {
    const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        if (prevBtn) prevBtn.disabled = track.scrollLeft <= 1;
        if (nextBtn) nextBtn.disabled = track.scrollLeft >= max - 1;
    };

    if (prevBtn) prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        track.scrollBy({ left: -getStep(), behavior: 'smooth' });
    });
    if (nextBtn) nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        track.scrollBy({ left: getStep(), behavior: 'smooth' });
    });

    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    Array.from(track.querySelectorAll('img')).forEach((img) => {
        if (!img.complete) img.addEventListener('load', update, { once: true });
    });
    observeVisible(carousel, update);

    requestAnimationFrame(update);
}

function setupLoop(carousel, track, prevBtn, nextBtn, getStep) {
    const real = Array.from(track.children);
    const n = real.length;

    const firstClone = real[0].cloneNode(true);
    const lastClone = real[n - 1].cloneNode(true);
    [firstClone, lastClone].forEach((c) => {
        c.setAttribute('aria-hidden', 'true');
        c.classList.add('is-clone');
    });
    track.insertBefore(lastClone, real[0]);
    track.appendChild(firstClone);

    let ready = false;
    const ensureInit = () => {
        if (ready) return;
        const step = getStep();
        if (step <= 0) return;
        track.scrollLeft = step;
        ready = true;
    };

    const normalize = () => {
        const step = getStep();
        if (step <= 0) return;
        if (track.scrollLeft >= (n + 1) * step - 1) {
            track.scrollLeft = step;
        } else if (track.scrollLeft <= 1) {
            track.scrollLeft = n * step;
        }
    };

    const settleThenNormalize = () => {
        let last = NaN;
        let stable = 0;
        const tick = () => {
            const cur = track.scrollLeft;
            if (Math.abs(cur - last) < 0.5) {
                if (++stable >= 3) { normalize(); return; }
            } else {
                stable = 0;
            }
            last = cur;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    if (prevBtn) prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        track.scrollBy({ left: -getStep(), behavior: 'smooth' });
        settleThenNormalize();
    });
    if (nextBtn) nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        track.scrollBy({ left: getStep(), behavior: 'smooth' });
        settleThenNormalize();
    });

    ensureInit();
    requestAnimationFrame(ensureInit);
    window.addEventListener('load', ensureInit);
    Array.from(track.querySelectorAll('img')).forEach((img) => {
        if (!img.complete) img.addEventListener('load', ensureInit, { once: true });
    });
    observeVisible(carousel, ensureInit);
}

function setupDrag(track) {
    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;
    let pointerId = null;

    track.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        isDown = true;
        moved = false;
        startX = e.clientX;
        startScroll = track.scrollLeft;
        pointerId = e.pointerId;
    });

    track.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        if (!moved && Math.abs(dx) > 5) {
            moved = true;
            track.classList.add('is-dragging');
            try { track.setPointerCapture(pointerId); } catch (_) {}
        }
        if (moved) track.scrollLeft = startScroll - dx;
    });

    const endDrag = () => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove('is-dragging');
        if (pointerId != null && track.hasPointerCapture && track.hasPointerCapture(pointerId)) {
            track.releasePointerCapture(pointerId);
        }
        pointerId = null;
    };

    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    track.addEventListener('click', (e) => {
        if (moved) {
            e.preventDefault();
            e.stopPropagation();
            moved = false;
        }
    }, true);
}

function observeVisible(el, cb) {
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) cb();
        });
    }).observe(el);
}
