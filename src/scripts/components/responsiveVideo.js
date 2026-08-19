/*
    Подмена src у <video> по ширине экрана и по движку браузера.
    Медиазапросы в <source> для видео не работают, поэтому выбор делает скрипт.

      [data-responsive-video]  — <video>
        data-video             — источники через запятую, в порядке предпочтения
        data-video-mobile      — источники для узких экранов
        data-video-media       — медиазапрос мобильного, по умолчанию (max-width: 767px)
*/

// У .mov тип без параметра codecs: на codecs="hvc1" Safari отвечает отказом.
const MIME_BY_EXTENSION = {
    webm: 'video/webm; codecs="vp9"',
    mov: 'video/quicktime',
    mp4: 'video/mp4',
};

const ALPHA_EXTENSIONS = ['.webm', '.mov'];

export default function initResponsiveVideo() {
    document.querySelectorAll('[data-responsive-video]').forEach(setupVideo);
}

function setupVideo(video) {
    const desktop = pickSources(video, video.getAttribute('data-video'));
    if (!desktop.length) return;

    const mobile = pickSources(video, video.getAttribute('data-video-mobile'));
    const query = window.matchMedia(video.getAttribute('data-video-media') || '(max-width: 767px)');

    let queue = [];

    const play = () => {
        const src = queue[0];
        if (!src || video.getAttribute('src') === src) return;

        video.setAttribute('src', src);
        video.load();

        const playing = video.play();
        if (playing) playing.catch(() => {});
    };

    const apply = () => {
        queue = (query.matches && mobile.length ? mobile : desktop).slice();
        play();
    };

    // Формат может быть заявлен, но не проиграться на конкретном файле — берём следующий.
    video.addEventListener('error', () => {
        if (queue.length > 1) {
            queue.shift();
            play();
        }
    });

    apply();
    query.addEventListener('change', apply);
}

function pickSources(video, list) {
    if (!list) return [];

    const all = list.split(',').map((src) => src.trim()).filter(Boolean);
    if (!all.length) return [];

    /*
        Прозрачный формат выбирается по движку, а не через canPlayType: тот отвечает
        только про кодек. Safari проигрывает WebM, Firefox — HEVC, но альфу в чужом
        формате оба игнорируют и рисуют чёрный прямоугольник. Чужой формат убираем
        совсем, чтобы при осечке упасть на непрозрачный mp4, а не на черноту.
    */
    const mine = isWebKit() ? '.mov' : '.webm';
    const sources = all.filter((src) => !hasExtension(src, ALPHA_EXTENSIONS) || hasExtension(src, [mine]));

    const playable = sources.filter((src) => {
        const type = MIME_BY_EXTENSION[src.split('.').pop().toLowerCase()];
        return type && video.canPlayType(type) !== '';
    });

    // Не взялся ни за один — отдаём последний: пусть решает сам, это лучше пустого src.
    return playable.length ? playable : sources.slice(-1);
}

// vendor: 'Apple Computer, Inc.' у WebKit, 'Google Inc.' у Chrome, пусто у Firefox.
// GestureEvent — подстраховка. На iOS все браузеры на WebKit, им всем нужен HEVC.
function isWebKit() {
    return /Apple/.test(window.navigator.vendor || '') || 'GestureEvent' in window;
}

function hasExtension(src, extensions) {
    const lower = src.toLowerCase();

    return extensions.some((extension) => lower.endsWith(extension));
}
