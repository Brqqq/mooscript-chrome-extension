/*global chrome*/
import React from "react";
import Play from "./icons/play.svg";
import Pause from "./icons/pause.svg";

import Buy from "./icons/buy.svg";
import Sold from "./icons/sold.svg";
import SmallCrime from "./icons/smallcrime.svg";
import GTA from "./icons/gta.svg";
import JailBusting from "./icons/jailbusting.svg";
import Drugrun from "./icons/drugrun.svg";
import LeadMining from "./icons/leadmining.svg";
import BulletFactory from "./icons/bulletfactory.svg";

import BanLine from "./icons/ban-line.svg";
import Ascending from "./icons/ascending.svg";
import Descending from "./icons/descending.svg";
import DefaultSort from "./icons/sort-result.svg";

import { sortAccounts } from "./sorting";
import TypeChooser from "./TypeChooser";

const jailBustingIcon = <img title="Jail busting" className="icon" src={JailBusting} />;
const smallCrimeIcon = <img title="Small crimes" className="icon" src={SmallCrime} />;
const gtaIcon = <img title="GTA" className="icon" src={GTA} />;
const carSellingIcon = <img title="Car seller" className="icon" src={Sold} />;
const buyItemsIcon = <img title="Item buyer" className="icon" src={Buy} />;
const drugDealingIcon = <img title="Drug dealing" className="icon" src={Drugrun} />;
const pbfIcon = <img title="Buy personal bullet factory" className="icon" src={BulletFactory} />;

const Name = ({ account }) => {
    if (account.invalidPassword) {
        return <span style={{ color: "red" }}>Incorrect password!</span>
    } else if(account.dead) {
        return <><span style={{ color: "red"}}>DEAD</span> ({account.name})</>;
    }
    else if (!account.name) {
        return <>Loading...</>
    }

    return <>{account.name}</>;
}

const DeathStrike =  ({ dead, children }) => {
    const style = dead ? {
        textDecoration: "line-through",
        color: "red"
    } : undefined;

    return <span style={style}>
        {children}
    </span>
}

const ConfigIcon = ({ email, title, account, svg, propName }) => {
    const onPropToggle = () => {
        const newValue = account[propName] == null || account[propName] === false;

        const newAccount = {
            ...account,
            [propName]: newValue
        };

        chrome.extension.getBackgroundPage().updateAccount(email, newAccount);
    }

    return <button className="link-button" onClick={() => onPropToggle(email, propName)}>
        <img title={title} className="icon" src={svg} />
        {!account[propName] && <img title={title} className="icon layered" src={BanLine} />}
    </button>
}


const AccountTable = (props) => {
    const [sortProp, setSortProp] = React.useState("email");
    const [isAsc, setIsAsc] = React.useState(true);
    const [lastLoggedIn, setLastLoggedIn] = React.useState(undefined);
    const {
        onRemove,
        accounts,
        onScriptActiveChange,
        columnVisibility
    } = props;

    const onLogin = (e, email) => {
        setLastLoggedIn(email);
        props.onLogin(e, email);
    }

    let accountList = Object.keys(accounts).map(email => ({
        ...accounts[email],
        email
    }));

    const sortOnProp = (propName) => {
        let shouldBeAsc = true;
        if (sortProp === propName) {
            if (isAsc === true) shouldBeAsc = false;
            else if (isAsc === false) shouldBeAsc = undefined;
            else if (isAsc == null) shouldBeAsc = true;
        }

        setSortProp(propName);
        setIsAsc(shouldBeAsc);
    }

    let sortedAccounts = [...accountList];
    if (isAsc != null) {
        sortAccounts(sortedAccounts, sortProp, isAsc);
    }

    const SortButton = ({ prop, children }) => {
        let sortIcon = DefaultSort;
        if (prop === sortProp) {
            if (isAsc === true) sortIcon = Ascending;
            else if (isAsc === false) sortIcon = Descending;
        }

        return <button style={{ width: "100%" }} className="link-button" onClick={() => sortOnProp(prop)}>
            <span style={{ display: "flex" }}>
                {children}
                <span style={{ flexGrow: 1 }}></span>
                <img className="small-icon" src={sortIcon} />
            </span>
        </button>
    }

    const onTypeChange = (account, email, newType) => {
        const newAccount = {
            ...account,
            type: newType
        };

        chrome.extension.getBackgroundPage().updateAccount(email, newAccount);
    }

    const visible = columnVisibility || {};
    return <table id="accounts">
        <thead>
            <tr>
                <th></th>
                {visible.type && <th><SortButton prop="type">Type</SortButton></th>}
                {visible.update && <th>Update</th>}
                <th>Login</th>
                <th>Start</th>
                {visible.scriptStatus && <th>Script status</th>}
                <th><SortButton prop="enableJailbusting">{jailBustingIcon}</SortButton></th>
                <th><SortButton prop="enableSmallCrime">{smallCrimeIcon}</SortButton></th>
                <th><SortButton prop="enableGta">{gtaIcon}</SortButton></th>
                <th><SortButton prop="enableCarSelling">{carSellingIcon}</SortButton></th>
                <th><SortButton prop="enableItemBuying">{buyItemsIcon}</SortButton></th>
                <th><SortButton prop="enableDrugRunning">{drugDealingIcon}</SortButton></th>
                <th><SortButton prop="enableBuyingPbf">{pbfIcon}</SortButton></th>
                <th><SortButton prop="email">Email</SortButton></th>
                <th><SortButton prop="name">Name</SortButton></th>
                <th><SortButton prop="rank">Rank</SortButton></th>
                {visible.cash && <th><SortButton prop="cash">Cash</SortButton></th>}
                {visible.stocks && <th><SortButton prop="stocks">Stocks</SortButton></th>}
                {visible.bullets && <th><SortButton prop="bullets">Bullets</SortButton></th>}
                {visible.country && <th><SortButton prop="country">Country</SortButton></th>}
                {visible.lead && <th><SortButton prop="lead">Lead</SortButton></th>}
                {visible.crew && <th><SortButton prop="crew">Crew</SortButton></th>}
                {visible.prevCrew && <th><SortButton prop="previousCrew">Previous crew</SortButton></th>}
                {visible.plane && <th><SortButton prop="plane">Plane</SortButton></th>}
                {visible.startDate && <th><SortButton prop="startDate">Start date</SortButton></th>}
                {visible.payingDays && <th><SortButton prop="payingDays">Paying days</SortButton></th>}
                {visible.honor && <th><SortButton prop="honor">Honor</SortButton></th>}
                {visible.credits && <th><SortButton prop="credits">Credits</SortButton></th>}
                <th>Remove</th>
            </tr>
        </thead>
        <tbody>
            {sortedAccounts.map((account, idx) => {
                const { email } = account;
                return <tr key={email} className={lastLoggedIn === email ? "highlight" : undefined}>
                    <td>
                        {idx + 1}
                    </td>
                    {visible.type && <td>
                        <TypeChooser onChange={(newType) => onTypeChange(account, email, newType)} value={account.type} />
                    </td>}
                   {visible.update && <td>
                        <button
                            title="Tries to update your account info in this table as soon as possible"
                            onClick={() => props.onAddToAccountUpdateList(email)}
                        >
                            Update
                        </button>
                    </td>}
                    <td>
                        <form method="post" action="https://www.mobstar.cc/main/login.php?mooscript=true" target="mobstar" onSubmit={(e) => onLogin(e, email)}>
                            <input type="hidden" name="email" value={email} />
                            <input type="hidden" name="password" value={account.password} />
                            <button type="submit">
                                Login
                                </button>
                        </form>
                    </td>
                    <td>
                        {account.active && <button className="link-button" onClick={() => onScriptActiveChange(email, false)}><img className="icon-small" src={Pause} /></button>}
                        {!account.active && <button className="link-button" onClick={() => onScriptActiveChange(email, true)}><img className="icon-small" src={Play} /></button>}
                    </td>
                    {visible.scriptStatus && <td>
                        {account.active && "Running..."}
                        {!account.active && "Paused"}
                    </td>}
                    <td className="composite-icon">
                        <ConfigIcon title="Jail busting" svg={JailBusting} propName="enableJailbusting" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="Small crimes" svg={SmallCrime} propName="enableSmallCrime" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="GTA" svg={GTA} propName="enableGta" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="Sell cars" svg={Sold} propName="enableCarSelling" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="Buy items" svg={Buy} propName="enableItemBuying" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="Sell drugs" svg={Drugrun} propName="enableDrugRunning" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="Buy personal bullet factory" svg={BulletFactory} propName="enableBuyingPbf" email={email} account={account} />
                    </td>
                    <td>{email}</td>
                    <td><Name account={account} /></td>
                    <td>
                        {!account.dead && account.rank}
                        {account.dead && <><span style={{ color: "red" }}>DEAD</span> ({account.rank})</>}
                    </td>
                    {visible.cash && <td><DeathStrike dead={account.dead}>€ {account.cash && account.cash.toLocaleString()}</DeathStrike></td>}
                    {visible.stocks && <td><DeathStrike dead={account.dead}>€ {account.stocks && account.stocks.toLocaleString()}</DeathStrike></td>}
                    {visible.bullets && <td><DeathStrike dead={account.dead}>{account.bullets}</DeathStrike></td>}
                    {visible.country && <td><DeathStrike dead={account.dead}>{account.country}</DeathStrike></td>}
                    {visible.lead && <td><DeathStrike dead={account.dead}>{typeof account.lead === "number" ? `${account.lead.toLocaleString()} kg` : account.lead}</DeathStrike></td>}
                    {visible.crew && <td><DeathStrike dead={account.dead}>{account.crew}</DeathStrike></td>}
                    {visible.prevCrew && <td><DeathStrike dead={account.dead}>{account.previousCrew}</DeathStrike></td>}
                    {visible.plane && <td><DeathStrike dead={account.dead}>{account.plane}</DeathStrike></td>}
                    {visible.startDate && <td><DeathStrike dead={account.dead}>{account.startDate}</DeathStrike></td>}
                    {visible.payingDays && <td><DeathStrike dead={account.dead}>{account.payingDays}</DeathStrike></td>}
                    {visible.honor && <td><DeathStrike dead={account.dead}>{account.honor}</DeathStrike></td>}
                    {visible.credits && <td><DeathStrike dead={account.dead}>{account.credits}</DeathStrike></td>}
                    <td>
                        <button onClick={e => {
                            e.preventDefault();
                            onRemove(email);
                        }}>
                            Remove
                        </button>
                    </td>
                </tr>
            })}
        </tbody>
    </table>
}

export default AccountTable;