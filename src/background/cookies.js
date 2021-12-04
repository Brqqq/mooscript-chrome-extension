export const setAuthCookie = (requestHeaders, cookieToSet) => {
    const cookieHeader = requestHeaders.find(header => header.name === "Cookie");

    if(cookieHeader) {
        cookieHeader.value = addToCookie(cookieHeader.value, cookieToSet);
    } else {
        requestHeaders.push({
            name: "Cookie",
            value: cookieToSet
        });
    }
    
}

const addToCookie = (cookie, cookieToAdd) => {
    const values = cookie.split(";");
    const toAddName = cookieToAdd.split("=")[0];

    let hasAdded = false;
    for(let i = 0; i < values.length; i++) {
        if(values[i].split("=")[0] === toAddName) {
            values[i] = cookieToAdd;
            break;
        }
    }

    if(!hasAdded) {
        values.push(cookieToAdd);
    }

    return values.join(";");
}
