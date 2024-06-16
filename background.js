let authenticationTabId;

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

chrome.action.onClicked.addListener(() => {
    console.log('Icon clicked');
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tabId === authenticationTabId && changeInfo.url && changeInfo.url.includes('access_token=')) {
        const url = new URL(changeInfo.url);
        const accessToken = url.hash.split('&').find(param => param.startsWith('access_token')).split('=')[1];
        chrome.storage.local.set({ accessToken: accessToken }, () => {
            console.log('Access token saved:', accessToken);
            chrome.tabs.remove(tabId);
        });
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: 'welcome.html' });
    }
});

chrome.action.onClicked.addListener(() => {
    console.log('Icon clicked');
});


