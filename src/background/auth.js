import { getAccounts } from "./storage.js";
import { setAuthCookie } from "./cookies.js";

let mobAuths = {};
let tabSessions = {};
let requests = {};

let manualLoginRequestId = "";

export const getAuthToken = (email) => mobAuths[email];
const setAuthToken = (email, authToken) => mobAuths[email] = authToken;

export const onTabAdded = (tabId, email) => tabSessions[tabId] = email;

// Every 15 min we clean old requests from the request map
// Sometimes they get abandoned, so we don't want to keep them around forever
setInterval(() => {
    const currDate = new Date().valueOf();
    const keys = Object.keys(requests);

    const timeBeforeCleanup = 1000 * 60 * 2;
    for (const key of keys) {
        const dateDifference = currDate - requests[key].date;

        if (dateDifference > timeBeforeCleanup) {
            delete requests[key];
        }
    }
}, 1000 * 60 * 15);

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({ url: "index.html" });
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabSessions[tabId]) {
        delete tabSessions[tabId];
    }
});

// When a new tab/window is created
chrome.webNavigation.onCreatedNavigationTarget.addListener(details => {
    if (details.sourceTabId && tabSessions[details.sourceTabId] != null) {
        tabSessions[details.tabId] = tabSessions[details.sourceTabId];
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabSessions[tabId] != null && changeInfo.status === 'complete') {
        const accounts = getAccounts();
        const account = accounts[tabSessions[tabId]];
        if (account != null) {
            chrome.tabs.executeScript(tabId, {
                code: `document.title = "${account.name}";`
            });
        }
    }
});

// All of this header magic is to distinguish extension HTTP requests vs non-extension HTTP requests
// Otherwise this script would constantly interfere with the user playing the game
chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        /* Identify somehow that it's a request initiated by you */

        if (details.url.includes("mooscript=true")) {
            manualLoginRequestId = details.requestId;
        }

        if (tabSessions[details.tabId] != null) {
            const email = tabSessions[details.tabId];
            const cookie = getAuthToken(email);

            setAuthCookie(details.requestHeaders, cookie);

            return { requestHeaders: details.requestHeaders };
        }

        // This means the the request came from somewhere other than our script
        if (manualLoginRequestId === details.requestId || details.url.includes("mooscript=true") || details.initiator == null || !details.initiator.includes("chrome-extension://")) {
            return { requestHeaders: details.requestHeaders };
        }
        const email = details.requestHeaders.find(header => header.name === "MooScript");
        if (!email) {
            console.error("Couldn't find email header in a request!");
            console.error("Headers: ", details.requestHeaders);

            return { requestHeaders: details.requestHeaders };
        }

        requests[details.requestId] = {
            email: email.value,
            date: new Date().valueOf()
        };

        const cookie = getAuthToken(email.value);
        // Initial login requests won't have a cookie
        if (cookie) {
            setAuthCookie(details.requestHeaders, cookie);
        }

        return { requestHeaders: details.requestHeaders };
    },
    { urls: ["https://*.mobstar.cc/*"] },
    ["blocking", "requestHeaders", "extraHeaders"]
);


chrome.webRequest.onHeadersReceived.addListener((details) => {
    if (tabSessions[details.tabId] != null && details.url.includes("https://www.mobstar.cc/main/message.php?msgid=1")) {
        const email = tabSessions[details.tabId];
        const account = getAccounts()[email];

        if (account) {
            tryLogin(email, account)
                .catch(e => console.error);
        }

        return { responseHeaders: details.responseHeaders };
    }

    if (details.url.includes("mooscript=true") || details.initiator == null || !details.initiator.includes("chrome-extension://")) {
        return { responseHeaders: details.responseHeaders };
    }

    const authCookies = details.responseHeaders.filter(header => header.name === "Set-Cookie" && header.value.includes("MOBSTAR_AUTH"));
    if (authCookies.length === 0) {
        return { responseHeaders: details.responseHeaders };
    }

    const { email } = requests[details.requestId];
    if (!email) {
        console.error("Couldn't map response to a matching request!");
        console.error("Headers: ", details.requestHeaders);

        return { responseHeaders: details.responseHeaders };
    }
    delete requests[details.requestId];

    const authCookie = authCookies.find(cookie => !cookie.value.includes("deleted"))

    if (authCookie) {
        const authCookieParts = authCookie.value.split(";");
        setAuthToken(email, authCookieParts[0]);

    } else {
        // Don't save the "deleted" cookie. It causes some weird infinite redirect issues
        setAuthToken(email, "");
    }
    // Strip set-cookie headers so they don't get saved and affect the tabs
    // We manually set the cookie so it doesn't affect us
    details.responseHeaders = details.responseHeaders.filter(header => header.name !== "Set-Cookie");
    return { responseHeaders: details.responseHeaders };
},
    { urls: ["https://*.mobstar.cc/*"] },
    ["blocking", "responseHeaders", "extraHeaders"]);