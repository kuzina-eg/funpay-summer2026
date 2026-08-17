/*
    Источник видео по брейкпоинту.

      [data-responsive-video]  — <video>
        data-video             — источник по умолчанию
        data-video-mobile      — источник для узких экранов
        data-video-media       — медиазапрос мобильного источника,
                                 по умолчанию (max-width: 767px) — как у картинок

    Через <source media> это не решается: браузеры выбор источника видео по
    медиазапросу не поддерживают. Два <video> с display:none тоже не подходят —
    скрытое всё равно тянет файл. Поэтому один элемент и подмена src.
*/

export default function initResponsiveVideo() {
    document.querySelectorAll('[data-responsive-video]').forEach(setupVideo);
}

function setupVideo(video) {
    const desktop = video.getAttribute('data-video');
    if (!desktop) return;

    const mobile = video.getAttribute('data-video-mobile') || desktop;
    const query = window.matchMedia(video.getAttribute('data-video-media') || '(max-width: 767px)');

    const apply = () => {
        const src = query.matches ? mobile : desktop;
        if (video.getAttribute('src') === src) return;

        video.setAttribute('src', src);
        video.load();

        const playing = video.play();
        if (playing) playing.catch(() => {});
    };

    apply();
    query.addEventListener('change', apply);
}
