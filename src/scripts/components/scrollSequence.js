/*
    Покадровое вращение картинок по скроллу страницы.

      [data-scroll-sequence]   — контейнер с <canvas> и постером <img> внутри
        data-sequence-src      — шаблон пути к кадру: {d} — плотность, {i} — номер
        data-sequence-count    — сколько кадров в секвенции

    Кадр — чистая функция от положения блока во вьюпорте, поэтому вниз секвенция
    отыгрывает вперёд, вверх — назад, и рывков при смене направления нет.

    Кадры рисуются в canvas: подмена src у <img> заставляет браузер декодировать
    картинку заново и даёт мигание, а drawImage по готовому Image — мгновенный.

    Секвенция весит мегабайты, поэтому грузится не сразу: старт по приближению
    блока к вьюпорту, дальше кадры тянутся пачками по порядку, а до полной
    загрузки рисуется ближайший уже загруженный кадр. Пока не загружен первый
    (или кадров вообще нет) — виден постер, разметка работает без скрипта.

    Кадры готовит tools/prepare-sequence.mjs.
*/

const CONCURRENCY = 6;
const NEAR_MARGIN = '100% 0px';

export default function initScrollSequence() {
    document.querySelectorAll('[data-scroll-sequence]').forEach(setupSequence);
}

function setupSequence(container) {
    const template = container.getAttribute('data-sequence-src');
    const count = parseInt(container.getAttribute('data-sequence-count'), 10);
    const canvas = container.querySelector('canvas');

    if (!template || !canvas || !(count > 1)) return;

    const density = pickDensity();
    const frameSrc = (index) => template
        .replace('{d}', density)
        .replace('{i}', String(index).padStart(3, '0'));

    whenNear(container, () => start(container, canvas, frameSrc, count));
}

function start(container, canvas, frameSrc, count) {
    /*
        Сдвиг фазы долей оборота: секвенция замкнута, поэтому сдвигаем по кругу.
        Нужен там, где в центре экрана оказывается неудачный ракурс — например
        задняя стенка вместо лицевой.
    */
    const shift = Math.round((parseFloat(container.getAttribute('data-sequence-offset')) || 0) * count);

    const frameFor = () => {
        const index = Math.round(progressOf(container) * (count - 1));
        return shift ? (index + shift) % count : index;
    };

    /*
        Первым грузим тот кадр, который нужен прямо сейчас, а не нулевой:
        иначе при заходе на середину страницы видно, как ПК докручивается
        от начала секвенции к нужному положению.
    */
    const entry = prefersReducedMotion() ? 0 : frameFor();

    loadImage(frameSrc(entry)).then((first) => {
        const context = canvas.getContext('2d');
        const frames = new Array(count);
        frames[entry] = first;

        canvas.width = first.naturalWidth;
        canvas.height = first.naturalHeight;

        let painted = -1;

        const draw = (index) => {
            const frame = nearestLoaded(frames, index);
            if (!frame || frame === frames[painted]) return;
            painted = frames.indexOf(frame);
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(frame, 0, 0, canvas.width, canvas.height);
        };

        draw(entry);
        container.classList.add('is-ready');

        if (prefersReducedMotion()) return;

        let wanted = entry;
        let ticking = false;

        const update = () => {
            ticking = false;
            wanted = frameFor();
            draw(wanted);
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();

        loadRest(frames, frameSrc, loadOrder(count, entry), (index) => {
            if (index === wanted || painted !== wanted) draw(wanted);
        });
    }).catch(() => {
        /* кадров нет — остаётся постер */
    });
}

/*
    0 — блок только показался снизу, 1 — полностью ушёл за верх.

    Блок у самого верха страницы никогда не проходит начало своего пути:
    на нулевом скролле он уже наполовину виден, и первую часть секвенции
    прокрутить нечем. Поэтому считаем, какой участок прогресса вообще
    достижим на этой странице, и растягиваем его на весь диапазон.
*/
function progressOf(container) {
    const rect = container.getBoundingClientRect();
    const travel = window.innerHeight + rect.height;
    if (travel <= 0) return 0;

    const raw = clamp((window.innerHeight - rect.top) / travel);

    const root = document.documentElement;
    if (!root) return raw;

    const top = rect.top + (window.scrollY || 0);
    const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
    const from = clamp((window.innerHeight - top) / travel);
    const to = clamp((window.innerHeight - (top - maxScroll)) / travel);

    // окно схлопнулось — растягивать нечего, отдаём как есть
    if (to - from < .05) return raw;

    return clamp((raw - from) / (to - from));
}

function clamp(value) {
    return Math.min(1, Math.max(0, value));
}

function nearestLoaded(frames, index) {
    if (frames[index]) return frames[index];

    for (let step = 1; step < frames.length; step += 1) {
        if (frames[index - step]) return frames[index - step];
        if (frames[index + step]) return frames[index + step];
    }

    return null;
}

/* Порядок догрузки: расходимся от стартового кадра в обе стороны по кругу */
function loadOrder(count, entry) {
    const seen = new Set([entry]);
    const order = [];

    for (let step = 1; order.length < count - 1; step += 1) {
        for (const index of [(entry - step + count) % count, (entry + step) % count]) {
            if (seen.has(index)) continue;
            seen.add(index);
            order.push(index);
        }
    }

    return order;
}

function loadRest(frames, frameSrc, order, onFrame) {
    let next = 0;

    const worker = () => {
        if (next >= order.length) return Promise.resolve();

        const index = order[next];
        next += 1;

        return loadImage(frameSrc(index))
            .then((frame) => {
                frames[index] = frame;
                onFrame(index);
            })
            .catch(() => {})
            .then(worker);
    };

    for (let i = 0; i < CONCURRENCY; i += 1) worker();
}

function whenNear(element, done) {
    if (!('IntersectionObserver' in window)) {
        done();
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            done();
        });
    }, { rootMargin: NEAR_MARGIN });

    observer.observe(element);
}

/*
    Плотность кадров.

    Бокс на десктопе — 1080 CSS px, столько же в кадре 1x: на обычном экране
    это 1:1. На дробных плотностях (1.25 и 1.5) и при зуме браузера кадр 1x
    растягивается, поэтому там честнее 2x — но он вчетверо тяжелее.

    Меняется одной строкой ниже:
      '1x'  — как сейчас, 17.9 МБ на три секвенции
      '2x'  — всегда двойные, 41.7 МБ
      отбор по экрану: window.devicePixelRatio > 1 ? '2x' : '1x'
*/
const DENSITY = '1x';

function pickDensity() {
    const connection = navigator.connection;
    if (connection && connection.saveData) return '1x';
    return DENSITY;
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}
