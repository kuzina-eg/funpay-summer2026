const SLOTS = ['is-left', 'is-center', 'is-right'];
const FRAME = 3000;
const PAUSE = 1800;

export default function initPcHeroCarousel() {
    document.querySelectorAll('[data-pc-hero]').forEach(setupHero);
}

function setupHero(carousel) {
    const cards = Array.from(carousel.querySelectorAll('[data-pc-hero-card]'));
    if (cards.length < SLOTS.length) return;

    let order = cards.map((card, index) => index);

    const place = () => {
        cards.forEach((card) => card.classList.remove(...SLOTS, 'is-incoming'));
        order.forEach((cardIndex, slot) => cards[cardIndex].classList.add(SLOTS[slot]));
    };

    const step = () => {
        const clone = cards[order[0]].cloneNode(true);

        clone.classList.remove(...SLOTS);
        clone.classList.add('is-incoming');
        clone.setAttribute('aria-hidden', 'true');
        carousel.append(clone);

        requestAnimationFrame(() => requestAnimationFrame(() => carousel.classList.add('is-moving')));

        window.setTimeout(() => {
            carousel.classList.remove('is-moving');
            clone.remove();
            order = [order[1], order[2], order[0]];
            place();
        }, FRAME + 40);
    };

    place();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const run = () => {
        step();
        window.setTimeout(run, FRAME + PAUSE);
    };

    window.setTimeout(run, PAUSE);
}
