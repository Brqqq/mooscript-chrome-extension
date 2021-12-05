import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { normalizeRank } from "./filterAccounts";

ChartJS.register(ArcElement, Tooltip, Legend);

const AccountChart = (props) => {
    const accounts = Object.keys(props.accounts).map(key => props.accounts[key]);
    const rankCount = accounts.reduce((ranks, account) => {
        let normalizedRank = normalizeRank(account.rank);
        if (!(normalizedRank in ranks)) {
            normalizedRank = "Hitman or lower";
        }
        return {
            ...ranks,
            [normalizedRank]: (ranks[normalizedRank] || 0) + 1
        }
    }, {
        "Godfather": 0,
        "Boss": 0,
        "Local Boss": 0,
        "Assassin": 0,
        "Hitman or lower": 0,
    });

    const data = {
        labels: Object.keys(rankCount),
        datasets: [{
            data: Object.values(rankCount),
            backgroundColor: [
                'rgba(9, 143, 86, 0.8)',
                'rgba(143, 193, 93, 0.8)',
                'rgba(242, 203, 34, 0.8)',
                'rgba(249, 144, 55, 0.8)',
                'rgba(245, 87, 59, 0.8)',
            ],
        }],
    }

    return <div style={{ marginRight: "10%", marginTop: 25, height: 250, width: 250, display: "inline-block" }}>
        <Doughnut data={data} />
    </div>;
}

export default AccountChart;