import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import "./style.scss";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    CircularProgress,
    Backdrop,
    Dialog,
    Divider,
    Typography,
    Fade,
    Box,
    Modal,
    List, ListItemButton, ListItemIcon, ListItemText, ListItemAvatar,
    Avatar
} from '@mui/material';

import { useHashConnect } from "../../assets/api/HashConnectAPIProvider.tsx";
import { getRequest, postRequest } from "../../assets/api/apiRequests";

import HashPackConnectModal from "../../components/HashPackConnectModal";
import AboutDlg from '../../components/MainMenu/AboutDlg';
import LeaderBoardDlg from "../../components/LeaderBoardDlg";
import StatDlg from "../../components/StatDlg";
import SettingDlg from "../../components/SettingDlg";

import * as env from "../../env";

function Home() {
    const [netType, setNetType] = useState("");
    const { walletData, installedExtensions, connect, disconnect, sendHbarToTreasury } = useHashConnect();
    const { accountIds } = walletData;

    const [walletConnectModalViewFlag, setWalletConnectModalViewFlag] = useState(false);
    const [aboutDlgViewFlag, setAboutDlgViewFlag] = useState(false);
    const [leaderBoardDlgViewFlag, setLeaderBoardDlgViewFlag] = useState(false);
    const [statDlgViewFlag, setStatDlgViewFlag] = useState(false);
    const [settingDlgViewFlag, setSettingDlgViewFlag] = useState(false);

    const [loadingView, setLoadingView] = useState(false);

    const [totalHbarAmount, setTotalHbarAmount] = useState(0);
    const [type, setType] = useState("deposit");
    const [inputAccountId, setInputAccountId] = useState("");
    const [money, setMoney] = useState(0);
    const [treasuryInfo, setTreasuryInfo] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(1);

    useEffect(() => {
        if (accountIds?.length > 0) {
            getInfo();
            getDepositedAmount();
            setInputAccountId(accountIds[0]);
            setTimeout(createEvent, 1000);
        }
    }, [accountIds]);

    useEffect(() => {
        document.getElementById("money").click();
    }, [money]);

    useEffect(() => {
        document.getElementById("treasury").click();
    }, [treasuryInfo]);

    const getInfo = async () => {
        setLoadingView(true);

        const _res = await getRequest(env.SERVER_URL + "/api/control/get_info");
        if (!_res) {
            toast.error("Something wrong with server!");
            setLoadingView(false);
            return;
        }
        if (!_res.result) {
            toast.error("No info!");
            setLoadingView(false);
            return;
        }
        if (_res.data.id === accountIds[0]) {
            setTreasuryInfo(true)
            document.getElementById("treasury").value = "true"
            document.getElementById("treasury").click();
        }

        setNetType(_res.data.network);
        setLoadingView(false);
    }

    const getDepositedAmount = async () => {
        setLoadingView(true);

        const _res = await getRequest(env.SERVER_URL + "/api/control/get_deposited_amount?accountId=" + accountIds[0]);
        if (!_res) {
            toast.error("Something wrong with server!");
            setLoadingView(false);
            return;
        }
        if (!_res.result) {
            setMoney(0);
            setLoadingView(false);
            return;
        }
        setMoney(_res.data.toFixed(3));
        setLoadingView(false);
    }

    const createEvent = () => {
        document.getElementById("walletId").click();
    }

    const onClickWalletConnectModalClose = () => {
        setWalletConnectModalViewFlag(false);
    }

    const onConnectHashpackWallet = () => {
        setWalletConnectModalViewFlag(true);
        setOpen(false)
    }

    const onConnectSolanaWallet = () => {
        setOpen(false)
    }

    const onGameExit = () => {
        document.getElementById("walletId").click();
    }

    const onClickDisconnectHashPack = () => {
        disconnect();
        setInputAccountId('');
        setTimeout(createEvent, 1000);
        setTreasuryInfo(false);
        setWalletConnectModalViewFlag(false);
    }

    const onClickCopyPairingStr = () => {
        navigator.clipboard.writeText(walletData.pairingString);
    };

    const onClickConnectHashPack = () => {
        if (installedExtensions) {
            connect();
            setWalletConnectModalViewFlag(false);
        } else {
            alert(
                "Please install HashPack wallet extension first. from chrome web store."
            );
        }
    };

    // const onConnectWallet = () => {
    //     if (!inputAccountId) {
    //         if (installedExtensions) {
    //             connect();
    //         } else {
    //             alert(
    //                 "Please install HashPack wallet extension first. from chrome web store."
    //             );
    //         }
    //     }
    //     else
    //         disconnect();
    // }

    const onDisConnectWallet = () => {
    }

    const onGoToLeaderBoard = async () => {
        setLeaderBoardDlgViewFlag(true);
    }

    const onGoToStat = async () => {
        setStatDlgViewFlag(true);
    }

    const onGoToSetting = async () => {
        setSettingDlgViewFlag(true);
    }

    const changeToRealValue = (value_, decimal_) => {
        return parseFloat(value_ / (10 ** decimal_)).toFixed(3);
    }

    const getWalletBalance = async () => {
        setLoadingView(true);
        let g_hbarBalance = 0;

        let g_hbarBalanceInfo = await getRequest(env.MIRROR_NET_URL + "/api/v1/balances?account.id=" + accountIds[0]);
        if (!g_hbarBalanceInfo || g_hbarBalanceInfo.balances?.length === 0) {
            g_hbarBalance = 0;
        }
        else {
            g_hbarBalance = g_hbarBalanceInfo.balances[0].balance;
        }
        if (Math.floor(parseInt(changeToRealValue(g_hbarBalance, 8), 10)) - 1 < 0)
            setTotalHbarAmount(0);
        else
            setTotalHbarAmount(Math.floor(parseInt(changeToRealValue(g_hbarBalance, 8), 10)) - 1);
        setLoadingView(false);
    }

    const onDeposit = async () => {
        setType("deposit");
        await getWalletBalance();
        setAboutDlgViewFlag(true);
    }

    const onWithdraw = async () => {
        const hbarAmount_ = parseInt(document.getElementById("withdraw").value, 10);

        if (hbarAmount_ > 0) {
            setLoadingView(true);
            const _res = await postRequest(env.SERVER_URL + "/api/control/withdraw", { accountId: accountIds[0], hbarAmount: hbarAmount_ });
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
            toast.success(_res.msg);
            setMoney(0);
            setLoadingView(false);
        }
    }

    const onEndRound = async () => {
        const _hbarAmount = document.getElementById("endRound").value;
        const _winflag = document.getElementById("endRound").getAttribute("winflag");
        const _earning = document.getElementById("endRound").getAttribute("earning");
        const _roundfee = document.getElementById("endRound").getAttribute("roundfee");

        const _res = await postRequest(env.SERVER_URL + "/api/control/end_round", { accountId: accountIds[0], hbarAmount: _hbarAmount, winflag: _winflag, earning: _earning, roundfee: _roundfee });
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
        setMoney (_hbarAmount)
    }

    const onDeal = async () => {
        const _hbarAmount = document.getElementById("money").value;
        const _res = await postRequest(env.SERVER_URL + "/api/control/update", { accountId: accountIds[0], hbarAmount: _hbarAmount });
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
    }

    const onPlay = async () => {
        await getDepositedAmount ()
    }

    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <>
            <canvas id="canvas" className='ani_hack' width="1700" height="768"> </canvas>
            <div data-orientation="landscape" className="orientation-msg-container">
                <p className="orientation-msg-text">Please rotate your device</p>
            </div>
            <div id="block_game"
                style={{ position: "fixed", backgroundColor: "transparent", top: 0, left: 0, width: "100%", height: "100%", display: "none" }}>
            </div>
            <Modal
                open={walletConnectModalViewFlag}
                onClose={() => onClickWalletConnectModalClose()}
                centered={true}
                className="hashpack-connect-modal"
            >
                <HashPackConnectModal
                    pairingString={walletData.pairingString}
                    connectedAccount={accountIds}
                    onClickConnectHashPack={onClickConnectHashPack}
                    onClickCopyPairingStr={onClickCopyPairingStr}
                    onClickDisconnectHashPack={onClickDisconnectHashPack}
                />
            </Modal>
            <Dialog open={aboutDlgViewFlag} scroll='body'>
                <AboutDlg
                    totalHbarAmount={totalHbarAmount}
                    type={type}
                    onDeposit={async (hbarAmount_) => {
                        setAboutDlgViewFlag(false);
                        setLoadingView(true);

                        const _approveResult = await sendHbarToTreasury(hbarAmount_);

                        if (!_approveResult) {
                            setLoadingView(false);
                            toast.error("something wrong with approve!");
                            return false;
                        }

                        const _res = await postRequest(env.SERVER_URL + "/api/control/deposit", { accountId: accountIds[0], hbarAmount: hbarAmount_ });
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
                        toast.success(_res.msg);
                        setMoney(parseInt(_res.data, 10));
                        setLoadingView(false);
                    }}
                    onCancel={() => {
                        setAboutDlgViewFlag(false);
                    }}
                />
            </Dialog>
            <Dialog
                open={leaderBoardDlgViewFlag}
                fullWidth={true}
                scroll='body'
                maxWidth='md'
            >
                <LeaderBoardDlg
                    onOK={() => setLeaderBoardDlgViewFlag(false)}
                />
            </Dialog>
            <Dialog
                open={statDlgViewFlag}
                fullWidth={true}
                scroll='body'
                maxWidth='md'
            >
                <StatDlg
                    onOK={() => setStatDlgViewFlag(false)}
                />
            </Dialog>
            <Dialog
                open={settingDlgViewFlag}
                fullWidth={true}
                scroll='body'
                maxWidth='md'
            >
                <SettingDlg
                    nettype={netType}
                    onSet={async (info_) => {
                        setLoadingView(true);
                        const _res = await postRequest(env.SERVER_URL + "/api/control/set", { accountId: accountIds[0], info: JSON.stringify(info_) });
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
                        toast.success(_res.msg);
                        setLoadingView(false);

                        setSettingDlgViewFlag(false)
                    }}
                    onCancel={() => setSettingDlgViewFlag(false)}
                />
            </Dialog>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loadingView}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <ToastContainer autoClose={5000} draggableDirection="x" />
            <button id="connectWallet" onClick={() => { handleOpen(); }} hidden/>
            <button id="disconnectWallet" onClick={() => onDisConnectWallet()} hidden />
            <button id="gameexit" onClick={() => onGameExit()} hidden />
            <button id="leaderBoard" onClick={() => onGoToLeaderBoard()} hidden />
            <button id="stats" onClick={() => onGoToStat()} hidden />
            <button id="setting" onClick={() => onGoToSetting()} hidden />
            <button id="deposit" value={0} onClick={onDeposit} hidden />
            <button id="withdraw" value={0} onClick={onWithdraw} hidden />
            <button id="dealbtn" value={0} onClick={onDeal} hidden />
            <button id="playbtn" value={0} onClick={onPlay} hidden />
            <button id="endRound" value={0} winflag={0} earning={0} roundfee={0} onClick={onEndRound} hidden />
            <input id="walletId" value={inputAccountId} onChange={(e) => setInputAccountId(e.target.value)} hidden />
            <input id="money" value={money} onChange={(e) => setMoney(e.target.value)} hidden />
            <input id="treasury" value={treasuryInfo} onChange={(e) => setTreasuryInfo(e.target.value)} hidden />
            <div>
                <Modal
                    aria-labelledby="transition-modal-title"
                    aria-describedby="transition-modal-description"
                    open={open}
                    onClose={handleClose}
                    closeAfterTransition
                    slots={{ backdrop: Backdrop }}
                    slotProps={{
                        backdrop: {
                            timeout: 500,
                        },
                    }}
                >
                    <Fade in={open}>
                        <Box sx={modalStyle}>
                            <Typography id="transition-modal-title" variant="h6" component="h2">
                                Choose a network
                            </Typography>
                            <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
                                <List component="nav" aria-label="main mailbox folders">
                                    <ListItemButton
                                        selected={selectedIndex === 0}
                                        onClick={(event) => onConnectHashpackWallet()}
                                        sx={{ backgroundColor: "" }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar alt="Remy Sharp" src="/sprites/hedera.png" />
                                        </ListItemAvatar>
                                        <ListItemText primary="Hedera" />
                                    </ListItemButton>
                                    <Divider variant="inset" component="li" />
                                    <ListItemButton
                                        selected={selectedIndex === 1}
                                        onClick={(event) => onConnectSolanaWallet()}
                                    >
                                        <ListItemAvatar>
                                            <Avatar alt="Remy Sharp" src="/sprites/solana.jpg" />
                                        </ListItemAvatar>
                                        <ListItemText primary="Solana" />
                                    </ListItemButton>
                                </List>
                            </Box>
                        </Box>
                    </Fade>
                </Modal>
            </div>
        </>
    );
}

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default Home;
