import React, { useState, useEffect } from 'react';
import "../../assets/css/styles/index.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    CircularProgress,
    Backdrop,
    Button,
} from '@mui/material';

import { getRequest } from "../../assets/api/apiRequests";
import * as env from "../../env";
import CustomPieChart from './chartWidget';

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

function StatDlg({
    onOK
}) {
    const [loadingView, setLoadingView] = useState(false);

    return (
        <div className="stat-div self-center bg-[#ffc0ff]">
            <div className="text_black w-full flex flex-col items-center justify-center">
                <div className="flex flex-col md:ml-10 mt-10 md:mt-0">
                    <div className="text-5xl p-5 w-full border-2 border-white flex justify-center">
                        <span className="bold text-[#8b1832] w-full text-light text-center">Winning Percentage</span>
                    </div>
                    <CustomPieChart />
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Button onClick={() => { onOK() }}
                        sx={MAIN_BUTTON_STYLE}>
                        OK
                    </Button>
                </div>
            </div>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loadingView}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <ToastContainer autoClose={5000} draggableDirection="x" />
        </div>
    );
}

export default StatDlg;
