export function isElementInViewport (el: Element) {

    const rect = el.getBoundingClientRect();

    return (
        rect.bottom >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    );
}