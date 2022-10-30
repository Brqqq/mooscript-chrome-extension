import "./lib/moment.js";
import "./lib/moment-timezone.js";

import { doSmallCrime } from "./actions/smallcrime.js"
import { updateRun, setManualDrugType, setGlobalSettings, setDrugrunType, addNewDetectiveSearch, addNewDetectiveFind, removeAccount, updateAccount, updateAccounts, addAccount, updateEveryAccount, resetDrugRun, getFromStorage, setInStorage, initStorage, getAccounts, getConfig, updateConfig, addAccountsToUpdateList, getDetective, removeDetectiveSearch, removeDetectiveResult, setSync, getSync } from "./storage.js";
import { doGta } from "./actions/carstealing.js";
import { sellCars } from "./actions/carseller.js";
import { findDrugRun } from "./actions/drugrunfinder.js";
import { doDrugDeal } from "./actions/drugdealing.js";
import { createLead } from "./actions/leadcreation.js";
import { collectWill } from "./actions/willcollector.js";
import { isDead, getDoc, isLoggedOut, isInJail, postForm, sleep } from "./actions/utils.js";
import { Routes } from "./actions/routes.js";
import { savePlayerInfo } from "./actions/saveplayerinfo.js";
import { buyItems } from "./actions/buyitems.js";
import { doJailbust } from "./actions/jailbuster.js";
import { fetchDrugRun } from "./actions/drugrunfetcher.js";
import { searchAccount } from "./detective/search.js";
import { findResult } from "./detective/findresult.js";
import { getAuthToken, onTabAdded } from "./auth.js";

window.addAccount = addAccount;

window.removeAccount = removeAccount;

window.updateAccounts = updateAccounts;

window.updateAccount = updateAccount;

window.updateEveryAccount = updateEveryAccount;

window.setInStorage = setInStorage;

window.resetDrugRun = resetDrugRun;

window.addAccountsToUpdateList = addAccountsToUpdateList;

window.removeDetectiveSearch = removeDetectiveSearch;
window.removeDetectiveResult = removeDetectiveResult;

window.setSync = setSync;

window.setDrugrunType = setDrugrunType;

window.setGlobalSettings = setGlobalSettings;
window.updateRun = updateRun;
window.setManualDrugType = setManualDrugType;

window.startDetectiveSearch = async (searcher, target, countries, clearPastSearches) => {
    const account = getAccounts()[searcher];
    if (!account) {
        return "The account you selected isn't in MooScript anymore...";
    }

    const task = async () => { 
        const result = await searchAccount(target, countries, clearPastSearches, searcher);
            if (result !== true) {
                return "There was an error: " + result;
            }
            await addNewDetectiveSearch(searcher, target, countries);
            return true;
    }

    const errors = {
        onJail: () => "Your account is in jail. Try again in a bit.",
        onUnknownError: () => "There was an unknown error",
        onDeath: () => "Your account is dead!"
    }

    return tryAction(account, task, errors);
}

window.login = async (email) => {
    const account = getAccounts()[email];

    let authToken = getAuthToken(email);

    try {
        if (authToken == null) {
            authToken = await tryLogin(email, account);
        }

        if (!authToken) {
            return false;
        }
    } catch (e) {
        console.log("ERROR WITH LOGIN", e);
        return false;
    }
    chrome.tabs.create({
        url: "https://www.mobstar.cc"
    }, (tab) => {
        tab.title = account.name;
        onTabAdded(tab.id, email);
    });

    return true;
}

const gameLoop = async (action, ticksInSeconds) => {
    let lastLoopTime = new Date();

    while (true) {
        await action();

        const timeLeftToWait = (ticksInSeconds * 1000) - (new Date().valueOf() - lastLoopTime.valueOf())

        if (timeLeftToWait > 0) {
            await new Promise(resolve => setTimeout(resolve, timeLeftToWait));
        }

        lastLoopTime = new Date();
    }

}

const performAction = (action, account, cooldown, lastActionInMs) => {
    if (lastActionInMs + cooldown < new Date().valueOf()) {
        return action(account);
    }
    return false;
}

// Some groups have an integration with MooScript
// If the 'sync' settings have been filled in, we will occasionally sync our data with the target server
const syncWithServer = async () => {
    const sync = getSync();

    if (sync.serverName) {
        const accounts = getAccounts();

        const payload = Object.keys(accounts)
            .filter(email => {
                const account = accounts[email];
                return !!account.name && account.active;
            })
            .map(email => {
                const acc = accounts[email];
                return {
                    name: acc.name.trim(),
                    email,
                    rank: acc.rank,
                    bullets: acc.bullets,
                    cash: acc.cash,
                    crew: acc.crew,
                    payingDays: acc.payingDays || "0",
                    lead: typeof acc.lead === "number" ? acc.lead.toLocaleString() : "",
                    honor: acc.honor,
                    country: acc.country,
                    plane: acc.plane || "",
                    previousCrew: acc.previousCrew || "",
                    startDate: acc.startDate || "",
                    dead: acc.dead
                }
            });
        try {
            await fetch(sync.url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: "update",
                    auth: {
                        username: sync.username,
                        password: sync.password
                    },
                    accounts: payload
                })
            });
        } catch (e) {
            console.error("ERROR with syncing!!");
            console.error(e);
        }
    }
}

const start = async () => {
    await initStorage();

    const getDefaultConfig = () => ({
        lastSmallCrime: 0,
        smallCrimeCooldown: 0,

        lastGta: 0,
        gtaCooldown: 0,

        lastCarSelling: 0,
        carSellingCooldown: 0,

        lastLeadCreation: 0,
        leadCreationCooldown: 0,

        lastDrugDeal: 0,
        drugDealingCooldown: 0,

        lastDrugFind: 0,
        drugFindCooldown: 0,

        lastDrugFetch: 0,
        drugFetchCooldown: 0,

        lastJailBust: 0,
        jailBustCooldown: 0,

        lastPlayerSaved: 0,
        playerSaveCooldown: 0,

        lastItemsBought: 0,
        itemBuyingCooldown: 0,

        willCheckingCooldown: 0,
        lastWillChecked: 0
    })
    const cooldownConfigs = {};

    const loop = async () => {
        const accounts = getAccounts();
        const config = getConfig();

        for (let email of Object.keys(accounts)) {
            if (config.updateAccounts.length > 0) {
                break;
            }

            const account = { ...accounts[email], email };
            if (!account.active) {
                continue;
            }

            let cooldownConfig = cooldownConfigs[email];

            if (cooldownConfig == null) {
                cooldownConfig = getDefaultConfig();
                cooldownConfigs[email] = cooldownConfig;
            }

            const tasks = async () => {
                const willCollectionResult = await performAction(collectWill, account, cooldownConfig.willCheckingCooldown, cooldownConfig.lastWillChecked);
                if (willCollectionResult) {
                    cooldownConfig.willCheckingCooldown = willCollectionResult;
                    cooldownConfig.lastWillChecked = new Date().valueOf();
                }

                if (account.enableSmallCrime) {
                    const smallCrimeResult = await performAction(doSmallCrime, account, cooldownConfig.smallCrimeCooldown, cooldownConfig.lastSmallCrime);
                    if (smallCrimeResult) {
                        cooldownConfig.smallCrimeCooldown = smallCrimeResult;
                        cooldownConfig.lastSmallCrime = new Date().valueOf();
                    }
                }

                if (account.enableGta) {
                    const gtaResult = await performAction(doGta, account, cooldownConfig.gtaCooldown, cooldownConfig.lastGta);
                    if (gtaResult) {
                        cooldownConfig.gtaCooldown = gtaResult;
                        cooldownConfig.lastGta = new Date().valueOf();
                    }
                }

                if (account.enableCarSelling) {
                    const carSellingResult = await performAction(sellCars, account, cooldownConfig.carSellingCooldown, cooldownConfig.lastCarSelling);
                    if (carSellingResult) {
                        cooldownConfig.carSellingCooldown = carSellingResult;
                        cooldownConfig.lastCarSelling = new Date().valueOf();
                    }
                }

                if (account.enableItemBuying) {
                    const itemBuyingResult = await performAction(buyItems, account, cooldownConfig.itemBuyingCooldown, cooldownConfig.lastItemsBought);
                    if (itemBuyingResult) {
                        cooldownConfig.itemBuyingCooldown = itemBuyingResult;
                        cooldownConfig.lastItemsBought = new Date().valueOf();
                    }
                }


                const leadCreationResult = await performAction(createLead, account, cooldownConfig.leadCreationCooldown, cooldownConfig.lastLeadCreation);
                if (leadCreationResult) {
                    cooldownConfig.leadCreationCooldown = leadCreationResult;
                    cooldownConfig.lastLeadCreation = new Date().valueOf();
                }

                if (account.enableDrugRunning) {
                    const drugDealResult = await performAction(doDrugDeal, account, cooldownConfig.drugDealingCooldown, cooldownConfig.lastDrugDeal);
                    if (drugDealResult) {
                        cooldownConfig.drugDealingCooldown = drugDealResult;
                        cooldownConfig.lastDrugDeal = new Date().valueOf();
                    }
                }

                if (config.drugrunType === "stats") {
                    if (account.enableDrugRunning) {
                        const drugFindResult = await performAction(findDrugRun, account, cooldownConfig.drugFindCooldown, cooldownConfig.lastDrugFind);
                        if (drugFindResult) {
                            cooldownConfig.drugFindCooldown = drugFindResult;
                            cooldownConfig.lastDrugFind = new Date().valueOf();
                        }
                    }
                }

                else if (config.drugrunType === "api") {
                    if (account.enableDrugRunning) {
                        const drugFetchResult = await performAction(fetchDrugRun, account, cooldownConfig.drugFetchCooldown, cooldownConfig.lastDrugFetch);
                        if (drugFetchResult) {
                            cooldownConfig.drugFetchCooldown = drugFetchResult;
                            cooldownConfig.lastDrugFetch = new Date().valueOf();
                        }
                    }
                }

                const savePlayerResult = await performAction(savePlayerInfo, account, cooldownConfig.playerSaveCooldown, cooldownConfig.lastPlayerSaved);
                if (savePlayerResult) {
                    cooldownConfig.playerSaveCooldown = savePlayerResult;
                    cooldownConfig.lastPlayerSaved = new Date().valueOf();
                }

                if (account.enableJailbusting) {
                    const jailBustResult = await performAction(doJailbust, account, cooldownConfig.jailBustCooldown, cooldownConfig.lastJailBust);
                    if (jailBustResult) {
                        cooldownConfig.jailBustCooldown = jailBustResult;
                        cooldownConfig.lastJailBust = new Date().valueOf();
                    }
                }

                await sleep(500);
            }

            await tryAction(account, tasks);
        }

        if (config.updateAccounts.length > 0) {

            const accountsToUpdate = config.updateAccounts.reduce((acc, email) => {
                return {
                    ...acc,
                    [email]: accounts[email]
                }
            }, {});

            for (let email of Object.keys(accountsToUpdate)) {
                const account = accounts[email];

                const task = async () => {
                    await performAction(savePlayerInfo, account, 0, 0);
                }

                await tryAction(account, task);
            }

            updateConfig({ updateAccounts: [] });
        }

        const detective = getDetective();
        const searching = Object.keys(detective.searching);
        if (searching.length > 0) {
            const foundResults = [];
            for (const searchKey of searching) {
                const search = detective.searching[searchKey];

                const account = accounts[search.searcher];
                if (!account) {
                    await removeDetectiveSearch(searchKey);
                    continue;
                }

                const onErrors = {
                    onDeath: () => removeDetectiveSearch(searchKey)
                };

                const task = async () => {
                    const result = await findResult(search.target, search.searcher);
                    if (result) {
                        foundResults.push({ id: searchKey, foundInCountry: result });
                    }
                }

                await tryAction(account, task, onErrors);
            }

            if (foundResults.length > 0) {
                await addNewDetectiveFind(foundResults);
            }
        }
    };

    gameLoop(loop, 30);
    gameLoop(syncWithServer, 60 * 15);
}

const fetchMobAuth = async (email, password) => {
    const fetchResult = await postForm(Routes.Login, `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, email, { disableSanitize: true });

    if (isLoggedOut(fetchResult.result)) {
        return false;
    }

    return getAuthToken(email);
}

const tryLogin = async (email, account) => {
    let attempt = 0;
    const maxAttempts = 3;
    do {
        const auth = await fetchMobAuth(email, account.password);
        if (auth) {
            if (account.invalidPassword) {
                await updateAccount(email, {
                    invalidPassword: false
                });
            }

            return auth;
        }
        await sleep(1000 * (attempt + 1));
        attempt++;
    } while (attempt < maxAttempts);

    await updateAccount(email, {
        invalidPassword: true,
        active: false
    });

    return false;
}

start();


const tryAction = async (account, action, onErrors) => {
    try {
        let auth = getAuthToken(account.email);

        if (auth == null) {
            auth = await tryLogin(account.email, account);
            if (!auth) return false;
        }

        return await action(account);

    } catch (e) {
        let fetchRes;
        try {
            fetchRes = await getDoc(Routes.TestPage, account.email);
        } catch (innerEx) {
            console.log("Error with connecting to mobstar");
            console.log("Initial error")
            console.error(e);
            console.log("Mobstar connection exception")
            console.error(innerEx);
            await sleep(5000);
            return false;
        }

        try {

            if (isDead(fetchRes.document)) {
                await updateAccount(account.email, {
                    dead: true,
                    active: false
                });
                return await onErrors?.onDeath?.();
            }
            else if (isLoggedOut(fetchRes.result)) {
                await tryLogin(account.email, account);
            } else if (isInJail(fetchRes.result)) {
                // Do nothing
                return await onErrors?.onJail?.();
            }
            else {
                console.error("Unknown error with user: " + account.email);
                console.error(e);
                console.error(fetchRes);
                return await onErrors?.onUnknownError?.();
            }
        } catch (innerEx) {
            console.error("Error while handling error with user: " + account.email);
            console.error(innerEx);
            console.error(fetchRes);
            return await onErrors?.onUnknownError?.();
        }
    }
}
window.tryAction = tryAction;
