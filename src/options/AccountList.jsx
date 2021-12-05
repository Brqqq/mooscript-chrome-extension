/*global chrome*/
import React from "react";
import AccountTable from "./AccountTable";

const AccountList = ({ filteredAccounts, config, filteredAccountKeys}) => {

    const onRemove = (email) => {
        chrome.extension.getBackgroundPage().removeAccount(email);
    }

    const onAddToAccountUpdateList = (email) => {
        chrome.extension.getBackgroundPage().addAccountsToUpdateList([email]);
    }

    const setActive = (email, isActive) => {
        chrome.extension.getBackgroundPage().updateAccount(email, {
            active: isActive
        });
    }

    const onLogin = async (e, email) => {
        e.preventDefault();

        const loginResult = await chrome.extension.getBackgroundPage().login(email);

        if (!loginResult) {
            alert("There was an error with logging in your account. Maybe the password is incorrect or mobstar doesn't work?");
        }
    }

    return <>
        {filteredAccountKeys.length === 0 && <div>There are no accounts.</div>}
        {filteredAccountKeys.length > 0 &&
            <AccountTable
                onAddToAccountUpdateList={onAddToAccountUpdateList}
                onRemove={onRemove}
                accounts={filteredAccounts}
                onScriptActiveChange={setActive}
                onLogin={onLogin}
                columnVisibility={config.columnVisibility}
            />
        }
    </>;
};

export default AccountList;