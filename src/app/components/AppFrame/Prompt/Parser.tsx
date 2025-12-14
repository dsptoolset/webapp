import { bilinearTransform, getCausalButterworthPoles, H_of_s, countNumberOfOccurrences, filter, lowPassImpulseResponse, bandpassImpulseResponse, elementWiseMultiply, elementWiseAdd,  Hamming, Bartlett, Han} from "../Common/Utils";
import { filterType } from '../Common/enums';

let vars = {};
const INVALID_COMMAND_MESSAGE = "Invalid usage! Type 'help' for assistance.";

export const parse = (cmd, log, updateLog, updateCmd) => {

    const rgx =
    {
        variableDecl: /\s*([a-z]+)\s*=\s*\[(.*)\]\s*$/,
        listVariables: /^\s*list\s*$/,
        clearVariables: /^\s*reset\s*$/,
        filter: /^\s*filter\s*\((.*)\)\s*$/,
        windowing: /^^\s*windowing\s*\(\s*(lowpass|highpass|bandpass|bandstop)\s*,\s*(rectangular|hamming|han|bartlett)\s*,\s*(\d+)\s*,\s*([0-9]*\.?[0-9]+)(?:\s*,\s*([0-9]*\.?[0-9]+))?\s*\)\s*$/,
        butterworth: /^^\s*butterworth\s*\(\s*(lowpass|highpass)\s*,\s*(\d+)\s*,\s*([0-9]*\.?[0-9]+)\)\s*$/
    }

    const patterns = [
        { regex: /^\s*clear\s*$/, action: () => updateLog(["Cleared..."]) },
        { regex: /^\s*help\s*$/, action: () => help(log, updateLog) },
        { regex: /^\s*version\s*$/, action: () => version(log, updateLog) },
        { regex: rgx.variableDecl, action: () => declareVariable(rgx.variableDecl, cmd, log, updateLog) },
        { regex: rgx.listVariables, action: () => listVariables(log, updateLog) },
        { regex: rgx.clearVariables, action: () => clearVariables(log, updateLog) },
        { regex: rgx.filter, action: () => execFilter(rgx.filter, cmd, log, updateLog) },
        { regex: rgx.windowing, action: () => execWindowing(rgx.windowing, cmd, log, updateLog) },
        { regex: rgx.butterworth, action: () => execButterworth(rgx.butterworth, cmd, log, updateLog) },
    ];

    for (let i = 0; i < patterns.length; i++) {
        if (patterns[i].regex.test(cmd)) {
            patterns[i].action();
            break;
        }
        if (i == patterns.length - 1) cmdNotFound(cmd, log, updateLog);
    }

    updateCmd("");
}

const help = (log, updateLog) => {
    const text = [
        "\n",
        "AvaDSP version 0.2",
        "Available commands:",
        "\t 'help' - Shows the help message",
        "\t 'version' - Shows the web apps version",
        "\t 'clear' - Clears the screen",
        "\t 'reset' - Deletes the declared variables in your session",
        "\nVariable decleration:",
        "\t a = [x y z] - Declares a list named 'a' with the elements x, y and z",
        "\nAvailable methods:",
        "\tfilter(x,a,b) - Performs filtering on the input 'x', with the coefficients of its transfer function \n\tdefined using the list 'a' for the numerator and the list 'b' for the denominator",
        "\t\n",
        "\twindowing(filter_type, window_type, N, w_c, w_s) - Designs a filter with the windowing method.\t",
        "\t\tfilter_type: 'lowpass', 'highpass', 'bandpass' or 'banstop' - Type of the filter\n",
        "\t\twindow_type: 'rectangular', 'hamming', 'han', 'bartlett' - Type of the window \n",
        "\t\tN: An integer - Filter order \n",
        "\t\tw_c: A float - Normalized frequency in radians per samples denoting start of cutoff frequency\n",
        "\t\tw_s (optional): A float - Normalized frequency in radians per samples denoting stop cutoff frequency for BP and BS filter\n",
        "\t\n",
        "\tbutterworth(filter_type, N, w_c) - Designs a filter via Butterworth method.\t",
        "\t\tfilter_type: 'lowpass' or 'highpass'' - Type of the filter\n",
        "\t\tN: An integer - Filter order \n",
        "\t\tw_c: A float - Normalized frequency in radians per samples denoting cutoff frequency\n",
    ];
    updateLog(log.concat(text));
}

const cmdNotFound = (cmd, log, updateLog) => {
    const text = [
        "Command '" + cmd + "' not found! Enter 'help' for addtional information."
    ];
    updateLog(log.concat(text));
}

const version = (log, updateLog) => {
    const text = ["\n", "Version 0.2 - Nov 19 2024"]
    updateLog(log.concat(text));
}

const declareVariable = (rgx, cmd, log, updateLog) => {
    const match = rgx.exec(cmd);

    const key = match[1];
    const values = match[2];

    vars[key] = values.split(/\s+/);

    const text = ["\n", `> ${key} = [${values}]`]
    updateLog(log.concat(text));

}

const listVariables = (log, updateLog) => {
    const text = [
        "Active variables: ", JSON.stringify(vars).replace(/"/g, '')
    ];
    updateLog(log.concat(text));
}

const clearVariables = (log, updateLog) => {
    vars = {};
    const text = ["Variables cleared", JSON.stringify(vars).replace(/"/g, '')]
    updateLog(log.concat(text));
}

const execFilter = (rgx, cmd, log, updateLog) => {

    const match = rgx.exec(cmd);
    const expr = match[1];
    if (countNumberOfOccurrences(expr, ",") != 2) {
        const text = ["\n", INVALID_COMMAND_MESSAGE]
        console.log(countNumberOfOccurrences(expr, ","))
        updateLog(log.concat(text));
        return;
    }
    let den = [];
    let num = [];
    let x = [];

    const args = expr.split(",");
    let m_var = args[0].match(/\s*([a-zA-Z])+\s*/);
    let m_brac = args[0].match(/\s*\[(.*)\]\s*/);
    if (m_var && m_var[1] !== undefined) {
        x = vars[m_var[1]];
    } else if (m_brac) {
        x = m_brac[1].split(/\s+/)
    }

    m_var = args[1].match(/\s*([a-zA-Z])+\s*/);
    m_brac = args[1].match(/\s*\[(.*)\]\s*/);
    if (m_var && m_var[1] !== undefined) {
        num = vars[m_var[1]];
    } else if (m_brac) {
        num = m_brac[1].split(/\s+/)
    }

    m_var = args[2].match(/\s*([a-zA-Z])+\s*/);
    m_brac = args[2].match(/\s*\[(.*)\]\s*/);
    if (m_var && m_var[1] !== undefined) {
        den = vars[m_var[1]];
    } else if (m_brac) {
        den = m_brac[1].split(/\s+/)
    }

    const text = ["\n", "[" + filter(x, { den: den, num: num }).toString() + "]"]
    updateLog(log.concat(text));
}

const getImpulseResponse = (w1, w2, filter_type, N = 1024) => {
    switch (filter_type) {
        case "lowpass":
            return lowPassImpulseResponse(w1, N);
        case "highpass":
            return bandpassImpulseResponse(Math.PI, w1, N);
        case "bandpass":
            return bandpassImpulseResponse(w1, w2, N);
        case "bandstop":
            return elementWiseAdd(bandpassImpulseResponse(Math.PI, w1, N), lowPassImpulseResponse(w1, N));
    }
}

const execWindowing = (rgx, cmd, log, updateLog) => {

    const match = rgx.exec(cmd);
    let filter_type = match[1];
    let w_1 = match[4];
    let w_2 = match[5];
    if(w_2 && (filter_type == 'lowpass' || filter_type == 'highpass')){
        const text = ["\n", "Error: Second cutoff frequency should not be specified for lowpass and highpass filters!"]
        updateLog(log.concat(text));
        return;
    }
    let N = match[3];
    let x = [];

    switch (match[2]) {
        case "rectangular":
            x = getImpulseResponse(w_1, w_1, filter_type, N);
            break;
        case "bartlett":
            x = elementWiseMultiply(getImpulseResponse(w_1, w_2, N), Bartlett(N))
            break;
        case "hamming":
            x = elementWiseMultiply(getImpulseResponse(w_1, w_2, N), Hamming(N))
            break;
        case "han":
            x = elementWiseMultiply(getImpulseResponse(w_1, w_2, N), Han(N))
            break;
    }
    const text = ["\n", "> " + cmd, x.join(' ')]
    updateLog(log.concat(text));
}

const execButterworth = (rgx, cmd, log, updateLog) => {
    const match = rgx.exec(cmd);
    let filter_type = match[1];
    let N = match[2];
    let w_c = match[3];
    let x = [];
    const Omega_c = 2 * Math.tan(w_c / 2);
    // 2: 
    let poles = getCausalButterworthPoles(N, Omega_c);
    let h_of_s;
    switch(filter_type)
    {
        case 'lowpass':
            h_of_s = H_of_s(poles, Omega_c, filterType.LOWPASS);
            break;
        case 'highpass':
            h_of_s = H_of_s(poles, Omega_c, filterType.HIGHPASS);
            break;
    }
    // 3. 
    const h_of_z = bilinearTransform(h_of_s);
    
    const text = ["\n", "> " + cmd, "num:" + h_of_z.num.join(' ') + " den:" + h_of_z.den.join(' ')]
    updateLog(log.concat(text));
}

