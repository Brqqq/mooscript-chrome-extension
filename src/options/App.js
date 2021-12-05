/*global chrome*/
import React from "react";
import './App.css';
import 'rodal/lib/rodal.css';
import NewUser from "./NewUser";
import AccountList from "./AccountList";
//import Paperbase from "./Paperbase";
import AccountChart from './AccountChart';
import { filterAccounts } from "./filterAccounts";
import AccountFilter from "./AccountFilter";
import Options from "./Options";
import Rodal from "rodal";
import ConfigureAccountsModal from "./ConfigureAccountsModal";

function App() {
    const [accounts, setAccounts] = React.useState({});
    const [drugs, setDrugs] = React.useState({});
    const [config, setConfig] = React.useState({});
    const [filter, setFilter] = React.useState({
        name: "",
        crewName: "",
        value: "",
        rank: ""
    });
    const [showAccountConfig, setShowAccountConfig] = React.useState(false);

    const onStorageChanges = (changes) => {
        if (changes.accounts != null) {
            setAccounts(changes.accounts.newValue);
        }
        if (changes.drugs != null) {
            setDrugs(changes.drugs.newValue);
        }
        if (changes.config != null) {
            setConfig(changes.config.newValue);
        }
    }

    React.useEffect(() => {
        chrome.storage.local.onChanged.addListener(onStorageChanges);
        return () => {
            chrome.storage.local.onChanged.removeListener(onStorageChanges);
        };
    }, []);

    React.useEffect(() => {
        chrome.storage.local.get(["accounts", "drugs", "config"], ({ accounts, drugs, config }) => {
            setAccounts(accounts || {});
            setDrugs(drugs || {});
            setConfig(config || {});
        })
    }, []);

    const onNewAccountAdded = (email, password) => {
        chrome.extension.getBackgroundPage().addAccount(email.trim().toLocaleLowerCase(), password.trim());
    }

    const hasDrugRun = drugs?.run1 != null && drugs?.run2 != null;
    const filteredAccounts = filterAccounts(accounts, filter);

    const filteredAccountKeys = Object.keys(filteredAccounts);
    const totalCash = filteredAccountKeys.reduce((acc, curr) => {
        const account = accounts[curr];
        if (!account.dead && Number.isInteger(account.cash)) {
            return acc + account.cash;
        }

        return acc;
    }, 0);

    const onStartAll = () => {
        chrome.extension
            .getBackgroundPage()
            .updateAccounts(Object.keys(filteredAccounts), { active: true });
    }

    const onStopAll = () => {
        chrome.extension
            .getBackgroundPage()
            .updateAccounts(Object.keys(filteredAccounts), { active: false });
    }

    return (
        // <Paperbase />
        <>
            <div style={{ display: "flex" }}>
            <div style={{ flexGrow: 1}}></div>
                <div className="App" style={{ flexGrow: 3 }}>
                    <a href="https://www.buymeacoffee.com/mooscript" target="_blank">☕ Buy me a coffee and support my work!</a>
                    <NewUser onSubmit={onNewAccountAdded} />

                    <Options accounts={accounts} drugs={drugs} />
                    {hasDrugRun && <h2>DR: {drugs.run1.country || "<unknown>"} -{'>'} {drugs.run2.country || "<unknown>"}</h2>}
                    {config.drugrunApiError && <span style={{ color: "red" }}>{config.drugrunApiError}</span>}
                    <h2>Total cash: € {totalCash.toLocaleString()}</h2>

                    <AccountFilter
                        filter={filter}
                        onFilterChange={setFilter}
                        onConfigureClick={() => setShowAccountConfig(true)}
                        startAll={onStartAll}
                        stopAll={onStopAll}
                    />

                </div>
                <AccountChart
                    accounts={accounts}
                />
            </div>
            <AccountList
                config={config}
                filteredAccountKeys={filteredAccountKeys}
                filteredAccounts={filteredAccounts}
            />

            {/* We dont use the `visibility` prop because we want an unmountOnExit behavior that doesn't exist */}
            {showAccountConfig && <Rodal
                visible
                onClose={() => setShowAccountConfig(false)}
                height={390}
            >
                <ConfigureAccountsModal
                    accounts={filteredAccounts}
                    onClose={() => setShowAccountConfig(false)}
                />
            </Rodal>}
        </>
    );
}

export default App;
