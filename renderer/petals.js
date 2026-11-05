//PETALS: creates falling pink petals using DOM manipulation yayyyy

//respect users who turned off animations in their system settings
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

    //number of petals on screen (change this to have more or fewer)
    const PETAL_COUNT = 24;

    //a layer that holds all the petals
    const layer = document.createElement('div');
    layer.id = 'petals';
    document.body.appendChild(layer);

    for (let i = 0; i < PETAL_COUNT; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal';

        const size = 10 + Math.random() * 14;      //petal size: 10-24px
        const duration = 9 + Math.random() * 9;    //fall time: 9-18 seconds

        //each petal gets its own random values (CSS reads these variables)
        petal.style.left = Math.random() * 100 + 'vw';             //start position
        petal.style.setProperty('--size', size + 'px');
        petal.style.setProperty('--dur', duration + 's');
        petal.style.setProperty('--delay', -Math.random() * duration + 's'); //negative = already falling at start
        petal.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px'); //sideways sway

        layer.appendChild(petal);
    }
}