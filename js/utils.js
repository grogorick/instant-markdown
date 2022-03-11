Object.defineProperty(Array.prototype, 'last', {
    value: function() { return this.length ? this[this.length - 1] : null; },
    enumerable: false
});

function debounce(timeout, func) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}