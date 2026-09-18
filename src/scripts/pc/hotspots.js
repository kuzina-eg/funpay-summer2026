const clipper = (el) => {
    let node = el.parentElement;

    while (node && node !== document.body) {
        const cs = getComputedStyle(node);

        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') return node;

        node = node.parentElement;
    }

    return null;
};

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

            point.classList.remove('is-flip-x', 'is-flip-y');
            tip.style.setProperty('--pc-tip-shift', '0px');

            const frame = clipper(point);
            if (!frame) return;

            const edge = frame.getBoundingClientRect();
            const gap = 8;

            const over = () => {
                const box = tip.getBoundingClientRect();

                return {
                    x: Math.max(0, edge.left + gap - box.left) + Math.max(0, box.right - (edge.right - gap)),
                    y: Math.max(0, edge.top + gap - box.top) + Math.max(0, box.bottom - (edge.bottom - gap)),
                };
            };

            for (const axis of ['x', 'y']) {
                if (!over()[axis]) continue;

                const was = over()[axis];
                const flip = axis === 'x' ? 'is-flip-x' : 'is-flip-y';

                point.classList.add(flip);
                if (over()[axis] >= was) point.classList.remove(flip);
            }

            const box = tip.getBoundingClientRect();
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
