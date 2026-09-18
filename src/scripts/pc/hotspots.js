export default function initPcHotspots() {
    const points = Array.from(document.querySelectorAll('[data-pc-point]'));
    if (!points.length) return;

    const close = (point) => {
        point.classList.remove('is-open');
        point.setAttribute('aria-expanded', 'false');
    };

    const closeAll = () => points.forEach(close);

    points.forEach((point) => {
        const tip = point.querySelector('.pc-point__tip');

        const fit = () => {
            if (!tip) return;

            const frame = point.closest('.pc-section');
            if (!frame) return;

            tip.style.setProperty('--pc-tip-shift', '0px');

            const edge = frame.getBoundingClientRect();
            const box = tip.getBoundingClientRect();
            const gap = 8;
            let shift = 0;

            if (box.right > edge.right - gap) shift = edge.right - gap - box.right;
            if (box.left + shift < edge.left + gap) shift = edge.left + gap - box.left;

            tip.style.setProperty('--pc-tip-shift', `${Math.round(shift)}px`);
        };

        point.addEventListener('pointerenter', fit);
        point.addEventListener('focus', fit);

        point.addEventListener('click', (event) => {
            if (event.target.closest('a, button')) return;

            event.stopPropagation();

            const wasOpen = point.classList.contains('is-open');

            closeAll();

            if (!wasOpen) {
                fit();
                point.classList.add('is-open');
                point.setAttribute('aria-expanded', 'true');
            }
        });
    });

    document.addEventListener('click', closeAll);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeAll();
    });
}
