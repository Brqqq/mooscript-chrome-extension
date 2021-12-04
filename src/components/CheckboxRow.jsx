/*global chrome*/
import React from "react";

const CheckboxRow = props => {
    return <tr>
        <td>
            <label htmlFor={props.description}>
                {props.description}
            </label>
        </td>
        <td>
            <input
                id={props.description}
                type="checkbox"
                checked={props.value}
                onChange={() => props.onChange(!props.value)}
            />
        </td>
    </tr>
}

export default CheckboxRow;