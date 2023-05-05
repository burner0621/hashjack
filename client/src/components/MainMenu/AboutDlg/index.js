import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MuiInput from '@mui/material/Input';

import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { TextField } from '@mui/material';

const MAIN_COLOR = '#ffc0ff';
const BUTTON_COLOR = '#fb497e';
const TITLE_COLOR = '#8b1832';

const MAIN_BUTTON_STYLE = {
    width: '120px',
    height: '48px',
    borderRadius: '24px',
    textTransform: 'none',
    fontSize: 18,
    fontWeight: 700,
    color: 'white',
    padding: '0 25px',
    backgroundColor: `${BUTTON_COLOR}`,
    margin: '5px 0',
    marginRight: '20px',
    '&:hover': {
        backgroundColor: `${BUTTON_COLOR}`,
        boxShadow: 'none',
    },
    '&:focus': {
        outline: 'none',
        boxShadow: 'none',
    }
};

function valueLabelFormat(value) {
    const units = ['KB', 'MB', 'GB', 'TB'];

    let unitIndex = 0;
    let scaledValue = value;

    while (scaledValue >= 1024 && unitIndex < units.length - 1) {
        unitIndex += 1;
        scaledValue /= 1024;
    }

    return `${scaledValue} }`;
}

function calculateValue(value) {
    return value;
}

function AboutDlg({
    totalHbarAmount,
    type,
    onDeposit,
    onWithdraw,
    onCancel
}) {
    // const [hbarAmount, setHbarAmount] = useState(totalHbarAmount);
    // const [hbarValueText, setHbarValueText] = useState();

    // const handleSliderChange = (e) => {
    //     setHbarAmount(e.target.value);
    // }

    let value = totalHbarAmount;

    const handleChange = (newValue) => {
        newValue = Number.parseFloat(newValue)
        if (typeof newValue === 'number') {
            value = newValue;
        }
    };

    return (
        <div
            style={{
                backgroundColor: `${MAIN_COLOR}`,
                width: '400px',
                padding: '20px 20px'
            }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <h1 style={{
                    fontWeight: '700',
                    margin: '0 0 10px 0',
                    color: `${TITLE_COLOR}`
                }}>HashJack</h1>
                <p style={{
                    fontWeight: '700',
                    color: `${TITLE_COLOR}`,
                    fontSize: 16
                }}>version 1.0</p>
                <Box sx={{ width: 250 }}>
                    <Typography id="non-linear-slider" gutterBottom>
                        Max:  {value} ℏ
                    </Typography>
                    <div className="form-outline m-3">
                        <input type="number" defaultValue={totalHbarAmount} onChange={(e) => handleChange(e.target.value)} autoFocus min={1} max={totalHbarAmount} id="typeNumber" className="form-control p-3" />
                    </div>
                </Box>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {
                        type === 'deposit' &&
                        <Button
                            onClick={() => { value ? onDeposit(value) : onCancel() }}
                            sx={MAIN_BUTTON_STYLE}
                            disabled={totalHbarAmount == 0}
                        >
                            Deposit
                        </Button>
                    }
                    <Button onClick={() => { onCancel() }}
                        sx={MAIN_BUTTON_STYLE}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div >
    );
}

export default AboutDlg;