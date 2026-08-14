import { Fancybox } from "@fancyapps/ui";

/*
	Fancybox
	https://fancyapps.com/docs/ui/fancybox/
*/

// Fancybox.defaults.dragToClose = false;
// Fancybox.defaults.Thumbs = false;
// Fancybox.defaults.infinite = false;
Fancybox.defaults.template = {
    closeButton: '<button data-fancybox-close class="f-button is-close-btn" title="{{CLOSE}}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" tabindex="-1"><path d="M20 20L4 4m16 0L4 20"/></svg></button>',

};

const options = {
    idle: false,
    compact: false,
    dragToClose: false,

    animated: false,
    showClass: 'f-fadeSlowIn',
    hideClass: false,

    Carousel: {
        infinite: false,
    },

    Images: {
        zoom: false,
        Panzoom: {
            maxScale: 1.5,
        },
    },

    Toolbar: {
        absolute: true,
        display: {
            left: [],
            middle: [],
            right: ['close'],
        },
    },

    Thumbs: {
        type: 'classic',
        Carousel: {
            axis: 'y',
            slidesPerPage: 1,
            Navigation: true,
            center: true,
            fill: true,
            dragFree: true,
        },
    },
};

export default function initFancybox() {
    let mediaOpen = false;

    const mediaOptions = {
        ...options,
        mainClass: 'fancybox--media',
        on: {
            reveal: () => { mediaOpen = true; },
            close: () => { setTimeout(() => { mediaOpen = false; }, 100); },
        },
    };

    Fancybox.bind('[data-fancybox="donated-pcs"]', mediaOptions);

    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-fancybox^="gallery-"]');
        if (!link) return;
        e.preventDefault();
        const group = link.getAttribute('data-fancybox');
        const links = Array.from(document.querySelectorAll(`[data-fancybox="${group}"]`));
        const slides = links.map((a) => ({ src: a.getAttribute('href'), type: 'image' }));
        Fancybox.show(slides, { ...mediaOptions, startIndex: Math.max(0, links.indexOf(link)) });
    });

    Fancybox.bind('[data-fancybox]:not([data-fancybox^="gallery-"]):not([data-fancybox="donated-pcs"])', {
        ...options,
        on: {
            reveal: (fancybox, slide) => {
                if (!slide || !slide.el) return;
                slide.el.querySelectorAll('[data-carousel-track]').forEach((track) => {
                    track.scrollLeft = 0;
                });
            },
            shouldClose: (fancybox, event) => {
                if (mediaOpen) {
                    event.preventDefault();
                    mediaOpen = false;
                }
            },
        },
    });
}
