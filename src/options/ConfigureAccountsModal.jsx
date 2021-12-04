/*global chrome*/
import React from "react";
import CheckboxRow from "../components/CheckboxRow";

const ConfigureAccountsModal = props => {
    const [settings, setSettings] = React.useState({
        enableJailbusting: true,
        enableSmallCrime: true,
        enableGta: true,
        enableCarSelling: true,
        enableItemBuying: true,
        enableDrugRunning: true,
        enableBuyingPbf: false
    });
    const [applyForAllAccounts, setApplyForAllAccounts] = React.useState(false);

    const onSaveClicked = (e) => {
        e.preventDefault();

        if (applyForAllAccounts) {
            chrome.extension.getBackgroundPage().updateEveryAccount(settings);
        } else {
            chrome.extension.getBackgroundPage().updateAccounts(Object.keys(props.accounts), settings);
        }
        props.onClose();
    }

    const onPropToggle = (propName) => {
        const newValue = !settings[propName];

        const newSettings = {
            ...settings,
            [propName]: newValue
        }

        setSettings(newSettings);
    }

    return <div>
        <div className="header">Configuration</div>
        <div className="body">
            <table>
                <tbody>
                    <CheckboxRow
                        description="Do jailbusting"
                        value={settings.enableJailbusting}
                        onChange={() => onPropToggle("enableJailbusting")}
                    />
                    <CheckboxRow
                        description="Do small crime"
                        value={settings.enableSmallCrime}
                        onChange={() => onPropToggle("enableSmallCrime")}
                    />
                    <CheckboxRow
                        description="Do GTA"
                        value={settings.enableGta}
                        onChange={() => onPropToggle("enableGta")}
                    />
                    <CheckboxRow
                        description="Sell cars"
                        value={settings.enableCarSelling}
                        onChange={() => onPropToggle("enableCarSelling")}
                    />
                    <CheckboxRow
                        description="Buy items"
                        value={settings.enableItemBuying}
                        onChange={() => onPropToggle("enableItemBuying")}
                    />
                    <CheckboxRow
                        description="Do drug runs"
                        value={settings.enableDrugRunning}
                        onChange={() => onPropToggle("enableDrugRunning")}
                    />
                    <CheckboxRow
                        description="Buy personal bullet factory"
                        value={settings.enableBuyingPbf}
                        onChange={() => onPropToggle("enableBuyingPbf")}
                    />
                </tbody>
            </table>

            <br />

            <input id="applytoselectedaccounts" type="radio" checked={!applyForAllAccounts} onChange={() => setApplyForAllAccounts(false)} />
            <label htmlFor="applytoselectedaccounts">Apply settings to the filtered accounts (the accounts you see in the list right now)</label>
            <br />
            <br />
            <input id="applytoallaccounts" type="radio" checked={applyForAllAccounts} onChange={() => setApplyForAllAccounts(true)} />
            <label htmlFor="applytoallaccounts">Apply settings to ALL the accounts that you have</label>
        </div>
        <button onClick={onSaveClicked} className="rodal-confirm-btn">
            Save
        </button>
        <button onClick={props.onClose} className="rodal-cancel-btn">Close</button>
    </div>

}

export default ConfigureAccountsModal;