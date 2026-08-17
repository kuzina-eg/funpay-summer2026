/*
    Видео по клику: до нажатия виден только постер, файл не качается.

      [data-video-player]      — контейнер
        video[preload=none]    — источник тянется лишь после клика
        .dream-video__play     — кнопка поверх постера

    После старта отдаём управление нативным контролам: так работают и пауза,
    и перемотка, и полноэкранный режим, включая iOS. Клик — это жест
    пользователя, поэтому воспроизведение со звуком разрешено.
*/

export default function initVideoPlayer() {
    document.querySelectorAll('[data-video-player]').forEach(setupPlayer);
}

function setupPlayer(container) {
    const video = container.querySelector('video');
    const button = container.querySelector('.dream-video__play');

    if (!video || !button) return;

    button.addEventListener('click', () => {
        container.classList.add('is-playing');
        video.controls = true;

        const playing = video.play();
        if (playing) {
            playing.catch(() => {
                // автозапуск отклонён — возвращаем постер с кнопкой
                container.classList.remove('is-playing');
                video.controls = false;
            });
        }
    });
}
