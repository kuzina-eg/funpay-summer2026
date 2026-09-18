export default function initPcCarousel() {
    document.querySelectorAll('[data-pc-carousel]').forEach(setupCarousel);
}

function setupCarousel(carousel) {
    const track = carousel.querySelector('[data-pc-carousel-track]');
    if (!track) return;

    const prevButton = carousel.querySelector('[data-pc-carousel-prev]');
    const nextButton = carousel.querySelector('[data-pc-carousel-next]');
    const bar = carousel.querySelector('[data-pc-carousel-bar]');
    const progress = bar ? bar.parentElement : null;
    const slots = [];

    const slideOffset = (slide) => {
        const align = getComputedStyle(slide).scrollSnapAlign.split(' ')[0];

        if (align === 'center') return slide.offsetLeft + slide.offsetWidth / 2 - track.clientWidth / 2;
        if (align === 'end') return slide.offsetLeft + slide.offsetWidth - track.clientWidth;

        return slide.offsetLeft;
    };

    const syncSlots = (count) => {
        while (slots.length > count) slots.pop().remove();

        while (slots.length < count) {
            const slot = document.createElement('span');

            slot.className = 'pc-carousel__slot';
            progress.insertBefore(slot, bar);
            slots.push(slot);
        }
    };

    const progressStyle = progress ? getComputedStyle(progress) : null;

    const slides = Array.from(track.children);

    const activeIndex = () => {
        const middle = track.scrollLeft + track.clientWidth / 2;
        let active = 0;
        let best = Infinity;

        slides.forEach((slide, index) => {
            const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - middle);

            if (distance < best) {
                best = distance;
                active = index;
            }
        });

        return active;
    };

    const markActive = () => {
        const active = activeIndex();

        slides.forEach((slide, index) => {
            slide.classList.toggle('is-active', index === active);
            slide.classList.toggle('is-before', index < active);
            slide.classList.toggle('is-after', index > active);
        });

        return slides[active];
    };

    const trackStyle = getComputedStyle(track);

    const syncShades = (active) => {
        if (!active) return;

        const gap = parseFloat(trackStyle.columnGap) || 0;
        const left = active.offsetLeft - track.scrollLeft - gap;
        const right = track.clientWidth - (active.offsetLeft - track.scrollLeft + active.offsetWidth) - gap;

        carousel.style.setProperty('--pc-shade-left', `${Math.max(0, left)}px`);
        carousel.style.setProperty('--pc-shade-right', `${Math.max(0, right)}px`);
    };

    const update = () => {
        syncShades(markActive());

        const max = track.scrollWidth - track.clientWidth;
        const ratio = max > 0 ? track.scrollLeft / max : 0;
        const atStart = track.scrollLeft <= 1;
        const atEnd = track.scrollLeft >= max - 1;

        if (progress) {
            const screens = Math.max(1, Math.round(track.scrollWidth / track.clientWidth));

            syncSlots(screens);

            const width = progress.clientWidth;
            const gap = parseFloat(progressStyle.columnGap) || 0;
            const slotWidth = (width - gap * (screens - 1)) / screens;

            bar.style.width = `${slotWidth}px`;
            bar.style.transform = `translateX(${ratio * (width - slotWidth)}px)`;
        }

        if (atStart) toFirst = false;
        carousel.classList.toggle('is-start', atStart || toFirst);

        if (prevButton) prevButton.disabled = atStart;
        if (nextButton) nextButton.disabled = atEnd;
    };

    const FRICTION = .68;
    const STEP = 1000 / 60;

    const duration = Number(carousel.dataset.pcCarouselSmooth) || 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation = null;
    let toFirst = false;

    const stopAnimation = () => {
        toFirst = false;

        if (!animation) return;

        cancelAnimationFrame(animation);
        animation = null;
        track.style.scrollSnapType = '';
    };

    const animateTo = (target) => {
        const max = track.scrollWidth - track.clientWidth;
        const to = Math.max(0, Math.min(max, target));

        let location = track.scrollLeft;
        let previous = location;
        let velocity = 0;
        let rest = STEP * 2;
        let last = null;

        if (animation) cancelAnimationFrame(animation);
        track.style.scrollSnapType = 'none';

        const frame = (now) => {
            if (last !== null) rest += now - last;
            last = now;

            while (rest >= STEP) {
                previous = location;
                velocity += (to - location) / duration;
                velocity *= FRICTION;
                location += velocity;
                rest -= STEP;
            }

            const alpha = rest / STEP;

            track.scrollLeft = location * alpha + previous * (1 - alpha);

            if (Math.abs(to - location) < .5) {
                track.scrollLeft = to;
                animation = null;
                track.style.scrollSnapType = '';
                update();
                return;
            }

            animation = requestAnimationFrame(frame);
        };

        animation = requestAnimationFrame(frame);
    };

    const scrollBy = (direction) => {
        const index = Math.min(slides.length - 1, Math.max(0, activeIndex() + direction));
        const next = slides[index];
        if (!next) return;

        toFirst = index === 0;
        if (toFirst) update();

        const target = slideOffset(next);

        if (duration && !reduced.matches) animateTo(target);
        else track.scrollTo({ left: target, behavior: 'smooth' });
    };

    if (prevButton) prevButton.addEventListener('click', () => scrollBy(-1));
    if (nextButton) nextButton.addEventListener('click', () => scrollBy(1));

    track.addEventListener('pointerdown', stopAnimation, { passive: true });
    track.addEventListener('wheel', stopAnimation, { passive: true });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    if (typeof ResizeObserver === 'function') {
        new ResizeObserver(update).observe(track);
    } else {
        window.addEventListener('load', update);
    }

    update();
}
