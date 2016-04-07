/**
 * Simple Webpack watch cookie extension
 */
// todo офрмить все круто
const COOKIE_NAME = 'webpack_watch';
const ACTIVE_ICON = 'assets/img/webpack.png';
const INACTIVE_ICON = 'assets/img/webpack_2.png';

/**
 * Main extension class.
 * @class
 */
class App {
    constructor(cookieName)
    {
        this.cookieName = cookieName || COOKIE_NAME;
    }

    getCookie(url, callback)
    {
        chrome.cookies.get({
            url: url,
            name: this.cookieName
        }, (cookie) => invoke(callback, cookie));
    }

    setCookie(url, value, callback)
    {
        const urlParts = parseUrl(url);

        chrome.cookies.set({
            url: url,
            name: this.cookieName,
            value: String(value),
            domain: urlParts.host,
            path: '/'
        }, (cookie) => invoke(callback, cookie));
    }

    isActive(cookie)
    {
        return cookie && cookie.value && cookie.value !== '0' && cookie !== 'false';
    }

    updateIcon(tab)
    {
        this.getCookie(
            tab.url,
            (cookie) => chrome.browserAction.setIcon({
                path: this.isActive(cookie) ? ACTIVE_ICON : INACTIVE_ICON,
                tabId: tab.id
            })
        );
    }

    reloadTab(tabId, callback)
    {
        chrome.tabs.reload(tabId, null, callback);
    }

    onTabActivated(tab)
    {
        this.updateIcon(tab);
    }

    onTabUpdated(tab)
    {
        this.updateIcon(tab);
    }

    onBrowserActionClicked(tab)
    {
        this.getCookie(
            tab.url,
            (cookie) => this.setCookie(
                tab.url,
                this.isActive(cookie) ? '0' : '1',
                () => this.reloadTab(tab.id)
            )
        );
    }
}

function parseUrl(url) {
    const a = document.createElement('a');
    a.href = url;

    return {
        host: a.host,
        path: a.pathname,
        protocol: a.protocol,
        query: a.search
    };
}

function invoke(fn, ...args)
{
    if (typeof fn === 'function') {
        fn(...args);
    }
}

var app = new App();

chrome.tabs.onActivated.addListener((evt) => {
    chrome.tabs.get(evt.tabId, (tab) => {
        app.onTabActivated(tab);
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    app.onTabUpdated(tab);
});

chrome.browserAction.onClicked.addListener((tab) => {
    app.onBrowserActionClicked(tab);
});
