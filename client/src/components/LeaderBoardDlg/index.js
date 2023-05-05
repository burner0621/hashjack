import React, { useState, useEffect } from 'react';
import { PieChart } from 'react-minimal-pie-chart';

import "../../assets/css/styles/index.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    CircularProgress,
    Backdrop,
    Button,
} from '@mui/material';

import { getRequest, postRequest } from "../../assets/api/apiRequests";
import * as env from "../../env";

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

function LeaderBoardDlg({
    onOK
}) {
    const [loadingView, setLoadingView] = useState(false);
    const [topHplayers, setTopHplayers] = useState(null);
    const [randomDelta, setRandomDelta] = useState(0.02);

    useEffect(() => {
        getLeaderBoardData();
        let randDel = Math.random() * 0.1;
        setRandomDelta(randDel);
    }, []);

    const getLeaderBoardData = async () => {
        setLoadingView(true);
        const _res = await getRequest(env.SERVER_URL + "/api/control/get_leaderboard_info");
        if (!_res) {
            toast.error("Something wrong with server!");
            setLoadingView(false);
            return;
        }
        if (!_res.result) {
            toast.error(_res.error);
            setLoadingView(false);
            return;
        }
        setTopHplayers(_res.data);
        setLoadingView(false);
    }

    return (
        <div className="stat-div self-center bg-[#ffc0ff]">
            <div className="text_black w-full flex flex-col items-center justify-center">
                <div className="text-5xl p-3">
                    <span className="bold text-[#8b1832]">Top 10 players</span> on Hedera
                </div>
                <div className="overflow-x-auto text_black block sm:flex justify-center  md:w-full w-[100vw]">
                    <table className="table-auto border-spacing-x-5 border-spacing-y-2  ">
                        <thead>
                            <tr className=" ">
                                <th className="text-light text-center p-3 md:p-3">Player</th>
                                <th className="text-light text-center p-3 md:p-3">Chain</th>
                                <th className="text-light text-center p-3 md:p-3">Earning</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topHplayers &&
                                topHplayers.length > 0 &&
                                topHplayers.map(
                                    (item, index) =>
                                        item._id !== "" && (
                                            <tr className=" " key={index}>
                                                <td className="text-light text-center  p-1 md:p-3">{item.accountId}</td>
                                                <td className="text-light text-center  p-1 md:p-3">Hedera</td>
                                                <td className="text-light text-center  p-1 md:p-3">
                                                    <strong>{item.earningAmount} ℏ </strong>
                                                </td>
                                            </tr>
                                        )
                                )}
                        </tbody>
                    </table>
                </div>
                <div className='m-3' style={{
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

export default LeaderBoardDlg;
