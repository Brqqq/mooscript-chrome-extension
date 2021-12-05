import { Routes } from "./routes.js"
import { getDoc, postForm, getCash } from "./utils.js";
const boughtCooldown = 3 * 60 * 60 * 1000;
const noMoneyCooldown = 15 * 60 * 1000;
export const buyItems = async (account) => {
    const buyOrder = [
        "weapon",
        "protection",
        "plane",
        "plf",
    ];

    const { document: inventoryDoc } = await getDoc(Routes.Inventory, account.email);
    
    const weapon = inventoryDoc.getElementById("weapondata").innerText;
    const weaponPrice = 50_000;
    const weaponBuyBody = ["item=weapon", "buyweapon=1", "buy=Buy this weapon", "buywhat=weapon"].join("&");

    const protection = inventoryDoc.getElementById("protectiondata").innerText;
    const protectionPrice = 130_000;
    const protectionBuyBody = ["item=protection", "buyprotection=1", "buy=Buy this protection", "buywhat=protection"].join("&");

    const plane = inventoryDoc.getElementById("planedata").innerText;
    const planePrice = 2_000_000;
    const planeBuyBody = ["item=plane", "buyplane=1", "buy=Buy this plane", "buywhat=plane"].join("&");

    const leadFactory = inventoryDoc.getElementById("plfdata").innerText;
    const leadFactoryPrice = 800_000;
    const leadFactoryBuyBody = ["item=plf", "buyplf=1", "buy=Buy this leadfactory", "buywhat=plf"].join("&");

    const bulletFactory = inventoryDoc.getElementById("pbfdata").innerText;
    const bulletFactoryPrice = 8_000_000;
    const bulletFactoryBuyBody = ["item=pbf", "buypbf=1", "buy=Buy this bulletfactory", "buywhat=pbf"].join("&");

    const depositBox = inventoryDoc.getElementById("depositboxdata").innerText;
    const depositBoxPrice = 1_000_000;
    const depositBoxBuyBody = ["item=depositbox", "buydepositbox=1", "buy=Buy this depositbox", "buywhat=depositbox"].join("&");

    const itemsData = [
        {
            buyItem: "weapon",
            price: weaponPrice,
            body: weaponBuyBody,
            current: weapon
        }, {
            buyItem: "protection",
            price: protectionPrice,
            body: protectionBuyBody,
            current: protection
        }, {
            buyItem: "plane",
            price: planePrice,
            body: planeBuyBody,
            current: plane
        }, {
            buyItem: "plf",
            price: leadFactoryPrice,
            body: leadFactoryBuyBody,
            current: leadFactory
        }, 
        // {
        //     buyItem: "depositbox",
        //     price: depositBoxPrice,
        //     body: depositBoxBuyBody,
        //     current: depositBox
        // }
    ];

    if(account.enableBuyingPbf) {
        itemsData.push({
            buyItem: "pbf",
            price: bulletFactoryPrice,
            body: bulletFactoryBuyBody,
            current: bulletFactory
        });

        buyOrder.push("pbf");
    }

    // Margin is so you don't spend all your money and won't be able to do drug runs
    const margin = 200_000;
    let cash = getCash(inventoryDoc);

    for (let i = 0; i < buyOrder.length; i++) {
        const buyItem = buyOrder[i];
        const itemInfo = itemsData.find(item => item.buyItem === buyItem);
        if (itemInfo === null) {
            throw new Error("Unknown buy item specified in config: " + buyItem);
        }

        if (itemInfo.current === "None") {
            if ((cash - margin) > itemInfo.price) {
                await postForm(Routes.Shop, itemInfo.body, account.email);
                cash -= itemInfo.price;
            } else {
                return noMoneyCooldown;
            }
        }
    }

    return boughtCooldown;
}