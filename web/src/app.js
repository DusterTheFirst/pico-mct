window.onload = () => {
    openmct.setAssetPath("./openmct/");
    openmct.install(openmct.plugins.LocalStorage());
    openmct.install(openmct.plugins.MyItems());
    openmct.install(openmct.plugins.UTCTimeSystem());
    openmct.time.clock('local', { start: -15 * 60 * 1000, end: 0 });
    openmct.time.timeSystem('utc');
    openmct.install(openmct.plugins.Espresso());

    openmct.start();
};
