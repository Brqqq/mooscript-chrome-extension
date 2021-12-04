/*global chrome*/
import React from "react";
import CheckboxRow from "../components/CheckboxRow";
import Rodal from "rodal";

const GlobalConfigModal = props => {
    const [visibilitySettings, setVisibilitySettings] = React.useState({
        type: false,
        update: false,
        scriptStatus: false,
        cash: false,
        bullets: false,
        country: false,
        lead: false,
        crew: false,
        prevCrew: false,
        plane: false,
        startDate: false,
        payingDays: false,
        honor: false,
        credits: false
    });

    React.useEffect(() => {
        chrome.storage.local.get("config", ({ config }) => {
            
            setVisibilitySettings(config.columnVisibility);
        });
    }, []);

    const onSaveClicked = (e) => {
        e.preventDefault();
        chrome.extension
            .getBackgroundPage()
            .setGlobalSettings(visibilitySettings)
            .then(props.onClose);
    }

    const onPropToggle = (propName) => {
        const newValue = !visibilitySettings[propName];

        const newSettings = {
            ...visibilitySettings,
            [propName]: newValue
        }

        setVisibilitySettings(newSettings);
    }

    return <Rodal
        visible
        onClose={props.onClose}
        height={600}
    >
        <div>
            <div className="header">Global settings</div>
            <div className="body">
                <table>
                    <thead>
                        <tr>
                            <th colSpan={2}>Column visibility</th>
                        </tr>
                        <tr>
                            <th>Column</th>
                            <th>Visible</th>
                        </tr>
                    </thead>
                    <tbody>
                        <CheckboxRow
                            description="Type"
                            value={visibilitySettings.type}
                            onChange={() => onPropToggle("type")}
                        />
                        <CheckboxRow
                            description="Update"
                            value={visibilitySettings.update}
                            onChange={() => onPropToggle("update")}
                        />
                        <CheckboxRow
                            description="Script status"
                            value={visibilitySettings.scriptStatus}
                            onChange={() => onPropToggle("scriptStatus")}
                        />
                        <CheckboxRow
                            description="Cash"
                            value={visibilitySettings.cash}
                            onChange={() => onPropToggle("cash")}
                        />
                        <CheckboxRow
                            description="Bullets"
                            value={visibilitySettings.bullets}
                            onChange={() => onPropToggle("bullets")}
                        />
                        <CheckboxRow
                            description="Country"
                            value={visibilitySettings.country}
                            onChange={() => onPropToggle("country")}
                        />
                        <CheckboxRow
                            description="Lead"
                            value={visibilitySettings.lead}
                            onChange={() => onPropToggle("lead")}
                        />
                        <CheckboxRow
                            description="Crew"
                            value={visibilitySettings.crew}
                            onChange={() => onPropToggle("crew")}
                        />
                        <CheckboxRow
                            description="Previous crew"
                            value={visibilitySettings.prevCrew}
                            onChange={() => onPropToggle("prevCrew")}
                        />
                        <CheckboxRow
                            description="Plane"
                            value={visibilitySettings.plane}
                            onChange={() => onPropToggle("plane")}
                        />
                        <CheckboxRow
                            description="Start date"
                            value={visibilitySettings.startDate}
                            onChange={() => onPropToggle("startDate")}
                        />
                        <CheckboxRow
                            description="Paying days"
                            value={visibilitySettings.payingDays}
                            onChange={() => onPropToggle("payingDays")}
                        />
                        <CheckboxRow
                            description="Honor"
                            value={visibilitySettings.honor}
                            onChange={() => onPropToggle("honor")}
                        />
                        <CheckboxRow
                            description="Credits"
                            value={visibilitySettings.credits}
                            onChange={() => onPropToggle("credits")}
                        />
                    </tbody>
                </table>
            </div>
            <button onClick={onSaveClicked} className="rodal-confirm-btn">
                Save
            </button>
            <button onClick={props.onClose} className="rodal-cancel-btn">Close</button>
        </div>
    </Rodal>
}

export default GlobalConfigModal;