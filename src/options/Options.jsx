/*global chrome*/
import React from "react";
import Rodal from "rodal";
import Sync from "./Sync";
import DrugrunSettings from "./DrugrunSettings";
import GlobalConfigModal from "./GlobalConfigModal";

const ExportModal = props => {
    return <Rodal
        visible
        onClose={props.onClose}
        height={250}
    >
        <div className="header">Export accounts</div>
        <div className="body">
            <div>
                This is the accounts export. You can install this extension on another machine and bring your accounts along. You have to copy this output and import it on the next machine.
            </div>
            <div style={{ color: "red" }}>
                WARNING: This output contains passwords! Be careful with whom you share it.
            </div>
            <br />
            <textarea style={{ width: "100%", height: 100 }} value={JSON.stringify(props.accounts)}></textarea>
        </div>
    </Rodal>
}

const ImportModal = props => {
    const [data, setData] = React.useState("");

    const onImportClick = async (e) => {
        e.preventDefault();
        let json;
        try {
            json = JSON.parse(data);
        } catch (e) {
            alert("Something is wrong with the data you're trying to import");
            console.error(e);
            return;
        }

        const lowercaseEmailedAccounts = Object.keys(json).reduce((acc, curr) => {
            return {
                ...acc,
                [curr.toLocaleLowerCase()]: json[curr]
            }
        }, {});
        try {
            await chrome.extension.getBackgroundPage().setInStorage({ accounts: lowercaseEmailedAccounts });
        } catch (e) {
            alert("Something went wrong during the import");
            console.error(e);
            return;
        }

        alert("Import successful!")
        props.onClose();
    }
    return <Rodal
        visible
        onClose={props.onClose}
        height={300}
    >
        <div className="header">Import accounts</div>
        <div className="body">
            <div>
                This is the accounts import. You can install this extension on another machine and bring your accounts along. You have to copy this output and import it on the next machine.
            </div>
            <div style={{ color: "red" }}>
                WARNING: Importing REPLACES the accounts you've already added on this machine. These accounts may be lost!
            </div>
            <br />
            <textarea
                style={{ width: "100%", height: 100 }}
                value={data}
                onChange={(e) => setData(e.target.value)}
            ></textarea>

            <button onClick={onImportClick} className="rodal-confirm-btn">Import</button>
            <button onClick={props.onClose} className="rodal-cancel-btn">Close</button>
        </div>
    </Rodal>
}


const Options = props => {

    const [showExportModal, setShowExportModal] = React.useState(false);
    const [showImportModal, setShowImportModal] = React.useState(false);
    const [showSyncModal, setSyncModal] = React.useState(false);
    const [showDrugrunConfig, setShowDrugrunConfig] = React.useState(false);
    const [showGlobalConfig, setShowGlobalConfig] = React.useState(false);

    const setAllToActiveStatus = (newStatus) => {
        chrome.extension.getBackgroundPage().updateEveryAccount({ active: newStatus });
    }
    const resetDrugRun = () => {
        chrome.extension.getBackgroundPage().resetDrugRun();
    }

    const updateAllAccounts = () => {
        chrome.extension.getBackgroundPage().addAccountsToUpdateList(Object.keys(props.accounts));
    }

    return <div style={{ marginTop: 8}}>
        <button onClick={updateAllAccounts}>Update all accounts</button>
        &nbsp;
        <button onClick={() => setAllToActiveStatus(false)}>Stop all</button>
        &nbsp;
        <button onClick={() => setAllToActiveStatus(true)}>Start all</button>
        &nbsp;
        <button onClick={() => setShowExportModal(true)}>Export</button>
        &nbsp;
        <button onClick={() => setShowImportModal(true)}>Import</button>
        &nbsp;
        <button onClick={() => setSyncModal(true)}>Sync</button>
        &nbsp;
        <button onClick={() => setShowDrugrunConfig(true)}>Drugrun config</button>
        &nbsp;
        <button onClick={() => setShowGlobalConfig(true)}>Global settings</button>
        &nbsp;
        <button onClick={resetDrugRun}>Reset drug run</button>
        &nbsp;
        <button onClick={() => window.location = "/messages.html"}>Witness list</button>

        {showExportModal && <ExportModal accounts={props.accounts} onClose={() => setShowExportModal(false)} />}
        {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} />}
        {showSyncModal && <Sync onClose={() => setSyncModal(false)} />}
        {showDrugrunConfig && <DrugrunSettings onClose={() => setShowDrugrunConfig(false)} />}
        {showGlobalConfig && <GlobalConfigModal onClose={() => setShowGlobalConfig(false)} />}
    </div>
}


export default Options;