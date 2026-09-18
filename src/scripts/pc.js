import setVariables from './setVariables';
import initFancybox from './components/fancybox';

import initPcHeroCarousel from './pc/heroCarousel';
import initPcCarousel from './pc/carousel';
import initPcHotspots from './pc/hotspots';
import initPcStory from './pc/story';

setVariables();

initPcHeroCarousel();
initPcCarousel();
initPcHotspots();
initPcStory();

initFancybox();
