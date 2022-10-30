/* global chrome */
import React from "react";
//import moment from "../background/lib/moment.js";
import moment from "../background/lib/moment-timezone.js";

const countries = ["Netherlands", "United States", "Italy", "China", "Great Britain"];

const getDrugTypes = () => ({
    Weed: "Nederwiet",
    XTC: "XTC",
    LSD: "LSD",
    Speed: "Speed",
    Shrooms: "Paddos",
    Heroin: "Opium",

    // Yeah I know this looks wrong, but that's just how they coded it...
    Cocaine: "Fireworks",
    Fireworks: "OptDrug1"
});

const DrugrunCountry = (props) => {
    const [country, setCountry] = React.useState();
    const [drug, setDrug] = React.useState();

    const onChange = async (country, drug) => {
        const now = moment().tz("Europe/Amsterdam");
        const todayTimestamp = now.format("YYYY-MM-DD");

        setCountry(country);
        setDrug(drug);
        
        await chrome
            .extension
            .getBackgroundPage()
            .setManualDrugType(props.runNr, country, drug, todayTimestamp);

        await chrome
            .extension
            .getBackgroundPage()
            .setDrugrunType("manual");
    }

    const onCountryChange = (e) => {
        onChange(e.target.value, drug);
    }

    const onDrugChange = (e) => {
        onChange(country, e.target.value);
    }

    const onStorageChanges = React.useCallback((changes) => {
        if (changes.drugs && changes.drugs.newValue != null) {
            const drugChanges = changes.drugs.newValue;
            const srcCountry = drugChanges["run" + props.runNr].country;
            
            const drug = drugChanges["run" + props.runNr].manualDrug;

            setCountry(srcCountry);
            setDrug(drug);
        }
    }, [props.runNr]);

    React.useEffect(() => {
        chrome.storage.local.onChanged.addListener(onStorageChanges);

        chrome.storage.local.get(["drugs"], ({ drugs }) => {
            onStorageChanges({
                drugs: {
                    newValue: drugs
                }
            })
        });

        return () => {
            chrome.storage.local.onChanged.removeListener(onStorageChanges);
        };
    }, [onStorageChanges]);

    return <span style={{ marginTop: 6, flex: 1, flexDirection: "column" }}>

        <select onChange={onCountryChange} value={country}>
            <option value=""></option>
            {countries.map(country => <option key={country} value={country}>
                {country}
            </option>)}
        </select>

        <select onChange={onDrugChange} value={drug}>
            <optgroup label="What drug to sell here">
                {Object
                    .keys(getDrugTypes())
                    .map(d => <option key={d} value={d}>{d}</option>
                    )}
            </optgroup>
        </select>

    </span>
}

export default DrugrunCountry;