const Kofo = {
    Sdk: require('./kofo'),
    Utils: require('kofo-utils')
};

(function () {
    if (!window.Kofo) {
        window.Kofo = Kofo;
    }
})();
