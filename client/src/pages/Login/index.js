import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import * as env from "../../env";
import "./style.scss";

import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TextField from "@mui/material/TextField";
import Modal from '@mui/material/Modal';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import { styled } from '@mui/material/styles';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import HashPackConnectModal from "components/HashPackConnectModal";
import { useHashConnect } from "../../assets/api/HashConnectAPIProvider.tsx";
import { getRequest, postRequest } from "../../assets/api/apiRequests";

import { Upload } from "../../components/Upload";
import NftCardSmall from "components/NftCardSmall";

const AccountInputTap = styled(TextField)({
    '& input': {
        height: 42,
        padding: "0 20px",
    },
    '& input:valid + fieldset': {
        borderColor: '#373B44',
    },
    '& input:valid:focus + fieldset': {
        borderColor: '#d5abff'
    },
    '& input:valid:hover + fieldset': {
        borderColor: '#d5abff'
    },
});

const PAGE_STATUS = ["LOG_IN", "SIGN_IN"];

function Login() {
    let history = useHistory();

    const [walletConnectModalViewFlag, setWalletConnectModalViewFlag] = useState(false);
    const { walletData, installedExtensions, connect, disconnect } = useHashConnect();
    const { accountIds } = walletData;

    const [pageStatus, setPageStatus] = useState(PAGE_STATUS[0]);
    const [loadingView, setLoadingView] = useState(false);
    const [refreshFlag, setRefreshFlag] = useState(false);
    
    const [loginFlag, setLoginFlag] = useState(false);
    const [playerInfo, setPlayerInfo] = useState({});
    
    const [walletNftInfo, setWalletNftInfo] = useState({});
    
    const [newPlayerId, setNewPlayerId] = useState("");
    const [uploadFile, setUploadFile] = useState({});

    useEffect(() => {
        if (accountIds?.length > 0) {
            setLoginFlag(false);
            getPlayerInfo(accountIds[0]);
            getWalletNftData(accountIds[0]);
        } else {
        }
    }, [accountIds]);

    const onClickWalletConnectModalClose = () => {
        setWalletConnectModalViewFlag(false);
    }

    const onClickOpenConnectModal = () => {
        setWalletConnectModalViewFlag(true);
        console.log("onClickOpenConnectModal log - 1 : ", walletData);
    }

    const onClickDisconnectHashPack = () => {
        disconnect();
        setWalletConnectModalViewFlag(false);
    }

    const onClickCopyPairingStr = () => {
        navigator.clipboard.writeText(walletData.pairingString);
    };

    const onClickConnectHashPack = () => {
        console.log("onClickConnectHashPack log - 1");
        if (installedExtensions) {
            connect();
            setWalletConnectModalViewFlag(false);
            setPageStatus(PAGE_STATUS[0]);
        } else {
            alert(
                "Please install HashPack wallet extension first. from chrome web store."
            );
        }
    };

    const onClickCreateNewPlayer = async () => {
        console.log(uploadFile[0]);
        console.log("onClickCreateNewPlayer log - 2 : ", uploadFile[0]);
        console.log("onClickCreateNewPlayer log - 3 : ", newPlayerId);

        if (newPlayerId === "") {
            toast.error("Please input Player ID.");
            return;
        }

        if (uploadFile?.length === 0) {
            toast.error("Please upload Avatar.");
            return;
        }

        setLoadingView(true);

        const o_formData = new FormData();
        o_formData.append('avatar', uploadFile[0]);

        const o_uploadResult = await postInfoResponse(env.SERVER_URL + "/api/account/upload_avatar", o_formData);
        console.log("onClickCreateNewPlayer log - 4 : ", o_uploadResult);
        if (!o_uploadResult) {
            toast.error("Something wrong with server!");
            setLoadingView(false);
            return;
        }

        if (!o_uploadResult.data.result) {
            toast.error("Image upload failed! Please try again.");
            setLoadingView(false);
            return;
        }

        const o_createNewPlayerResult = await postInfoResponse(env.SERVER_URL + "/api/account/create_new_player", {
            accountId: accountIds[0],
            playerId: newPlayerId,
            avatarName: o_uploadResult.data.data.name,
            phaserAvatarName: o_uploadResult.data.data.phaser_name,
            walletInfo: walletNftInfo
        });
        console.log("onClickCreateNewPlayer log - 5 : ", o_createNewPlayerResult);
        if (!o_createNewPlayerResult) {
            toast.error("Something wrong with server!");
            setLoadingView(false);
            return;
        }

        if (!o_createNewPlayerResult.data.result) {
            toast.error(o_createNewPlayerResult.data.error);
            setLoadingView(false);
            return;
        }
        toast.success("Create account successful.");
        setPlayerInfo({
            playerId: o_createNewPlayerResult.data.data.playerId,
            avatarUrl: o_createNewPlayerResult.data.data.avatarUrl
        })
        setLoginFlag(true);
        setPageStatus(PAGE_STATUS[0]);
        setLoadingView(false);
    }

    //--------------------------------------------------------------------------------------------------

    const getPlayerInfo = async (accountId_) => {
        console.log("getPlayerInfo log - 1: ", accountId_);
        setLoadingView(true);
        const g_playerInfo = await getInfoResponse(env.SERVER_URL + "/api/account/get_player?accountId=" + accountId_);
        console.log("getPlayerInfo log - 2: ", g_playerInfo);

        if (!g_playerInfo) {
            toast.error("Something wrong with server!");
            setLoadingView(false);
            return;
        }

        if (!g_playerInfo.data.result) {
            toast.error(g_playerInfo.data.error);
            setLoadingView(false);
            return;
        }

        setPlayerInfo({
            playerId: g_playerInfo.data.data.playerId,
            avatarUrl: g_playerInfo.data.data.avatarUrl
        });
        setLoginFlag(true);

        setLoadingView(false);
    }

    const getWalletNftData = async (accountId_) => {
        console.log("getWalletNftData log - 1 : ", accountId_);
        setLoadingView(true);

        let _nextLink = null;
        let _newWalletNftInfo = {
            degenlandCount: 0,
            tycoonCount: 0,
            mogulCount: 0,
            investorCount: 0
        };

        let _WNinfo = await getInfoResponse(env.MIRROR_NET_URL + "/api/v1/accounts/" + accountId_ + "/nfts");
        if (_WNinfo && _WNinfo.data.nfts.length > 0)
            _nextLink = _WNinfo.data.links.next;

        while (1) {
            let _tempNftInfo = _WNinfo.data.nfts;

            for (let i = 0; i < _tempNftInfo.length; i++) {
                if (_tempNftInfo[i].token_id === env.DEGENLAND_NFT_ID) {
                    _newWalletNftInfo.degenlandCount += 1;
                } else if (_tempNftInfo[i].token_id === env.TYCOON_NFT_ID) {
                    _newWalletNftInfo.tycoonCount += 1;
                } else if (_tempNftInfo[i].token_id === env.MOGUL_NFT_ID) {
                    _newWalletNftInfo.mogulCount += 1;
                } else if (_tempNftInfo[i].token_id === env.INVESTOR_NFT_ID) {
                    _newWalletNftInfo.investorCount += 1;
                }
            }

            if (!_nextLink || _nextLink === null) break;

            _WNinfo = await getInfoResponse(env.MIRROR_NET_URL + _nextLink);
            _nextLink = null;
            if (_WNinfo && _WNinfo.data.nfts.length > 0)
                _nextLink = _WNinfo.data.links.next;
        }
        console.log("getWalletNftData log - 2 : ", _newWalletNftInfo);
        setWalletNftInfo(_newWalletNftInfo);
        setRefreshFlag(!refreshFlag);

        setLoadingView(false);
    }

    const handleLogin = async() => {
        setLoadingView(true);

        //check login
        const checkLoginResult = await getRequest(env.SERVER_URL + "/api/account/check_login?accountId=" + accountIds[0]);
        if (!checkLoginResult) {
            toast.error("Something wrong with server!");
            setLoadingView(false);
            return;
        }
        if (checkLoginResult.result == false) {
            toast.error(checkLoginResult.error);
            setLoadingView(false);
            return;
        }

        const postData = {
            accountId: accountIds[0],
            NftCount: walletNftInfo
        }
        const _postResult = await postRequest(env.SERVER_URL + "/api/account/set_nft_count", postData);
        if (!_postResult) {
            toast.error("Something wrong with server!");
            setLoadingView(false);
            return;
        }

        if (_postResult.result == false) {
            toast.error(_postResult.error);
            setLoadingView(false);
            return;
        }

        history.push('/main');
    }

    const handleMarketplaceLogin = () => {
        history.push('/marketplace/1');
    }

    //--------------------------------------------------------------------------------------------------

    const _getPlayerInfo = async () => {
    }

    // get nft information from mirrornode
    const getNftInfo = async (tokenId_, serialNum_) => {
        let _nftInfo;

        const _singleNftInfo = await getInfoResponse(`https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/${tokenId_}/nfts?serialNumber=${serialNum_}`);
        // console.log("getNftInfo log - 1 : ", _singleNftInfo);
        if (_singleNftInfo && _singleNftInfo.data.nfts.length > 0) {
            let _preMdUrl = base64ToUtf8(_singleNftInfo.data.nfts[0].metadata).split("//");
            // console.log("getNftInfo log - 2 : ", _preMdUrl);

            let _metadataUrl = "https://hashpack.b-cdn.net/ipfs/" + _preMdUrl[_preMdUrl.length - 1];
            let _metadata = await getInfoResponse(_metadataUrl);

            if (_metadata) {
                let _preImgUrl = _metadata.data.image.split("//");
                const _imgUrl = "https://hashpack.b-cdn.net/ipfs/" + _preImgUrl[1];
                const _tokenId = _singleNftInfo.data.nfts[0].token_id;
                const _serialNum = _singleNftInfo.data.nfts[0].serial_number;
                const _creator = _metadata.data.creator;
                const _name = _metadata.data.name;

                _nftInfo = {
                    tokenId: _tokenId,
                    serialNum: _serialNum,
                    creator: _creator,
                    name: _name,
                    imgUrl: _imgUrl
                }
            }
        }
        return _nftInfo;
    }

    // convert metadata base64 string to utf8
    const base64ToUtf8 = (base64Str_) => {
        // create a buffer
        const _buff = Buffer.from(base64Str_, 'base64');

        // decode buffer as UTF-8
        const _utf8Str = _buff.toString('utf-8');

        return _utf8Str;
    }

    // axios get
    const getInfoResponse = async (urlStr_) => {
        try {
            return await axios.get(urlStr_);
        } catch (error) {
            console.log(error);
        }
    };

    // axios post
    const postInfoResponse = async (urlStr_, postData_) => {
        let _response = await axios
            .post(urlStr_, postData_)
            .catch((error) => console.log('Error: ', error));
        if (_response && _response.data) {
            // console.log(_response);
            return _response;
        }
    }

    return (
        <>
            <div className="login-container">
                <div className="login-wrapper box-shadow">
                    <div className="width-100 display-flex flex-row item-center mt-4">
                        <Button
                            className="button-style1"
                            style={{ width: "240px" }}
                            onClick={() => onClickOpenConnectModal()}>
                            {accountIds?.length > 0 ? accountIds[0] : "Connect Wallet"}
                        </Button>
                    </div>
                    <div className="width-100 display-flex flex-row item-center mt-4 mb-4">
                        <img alt="" src={"/imgs/front/splitter-decoration.png"} />
                    </div>
                    {
                        !accountIds &&
                        <div className="width-100 display-flex flex-row item-center">
                            <span style={{
                                color: "#373B44",
                                fontSize: "18px",
                                fontWeight: "500"
                            }}>Please Connect Wallet!</span>
                        </div>
                    }
                    {
                        accountIds?.length > 0 &&
                        pageStatus === PAGE_STATUS[0] &&
                        <div>
                            {
                                !loginFlag &&
                                <div>
                                    <div className="width-100 display-flex flex-row item-center">
                                        <span style={{
                                            color: "#373B44",
                                            fontSize: "18px",
                                            fontWeight: "500"
                                        }}>Please sign up and create account</span>
                                    </div>
                                    <div className="width-100 display-flex flex-row item-center mt-2">
                                        <span onClick={() => {
                                            setPageStatus(PAGE_STATUS[1]);
                                        }}
                                            style={{
                                                color: "#606ae2",
                                                fontSize: "16px",
                                                fontWeight: "700",
                                                textDecoration: "underline",
                                                cursor: "pointer"
                                            }}>Sign up</span>
                                    </div>
                                </div>
                            }
                            {
                                loginFlag &&
                                <div>
                                    <div className="width-100 display-flex flex-row item-center">
                                        <Avatar
                                            src={env.SERVER_URL + playerInfo.avatarUrl}
                                            sx={{ width: 128, height: 128 }}
                                        />
                                    </div>
                                    <div className="width-100 display-flex flex-row item-center mt-2">
                                        <span style={{
                                            color: "#373B44",
                                            fontSize: "18px",
                                            fontWeight: "700"
                                        }}>{playerInfo.playerId}</span>
                                    </div>
                                    <div className="width-100 display-flex flex-row mt-3 customize-scroll-bar"
                                        style={{ height: "110px" }}>
                                        <NftCardSmall singleNftInfo={{ imgUrl: "imgs/front/nfts/degenland.png", name: "Degen", nftCount: walletNftInfo.degenlandCount }} />
                                        <NftCardSmall singleNftInfo={{ imgUrl: "imgs/front/nfts/tycoon.png", name: "Tycoon", nftCount: walletNftInfo.tycoonCount }} />
                                    </div>
                                    <div className="width-100 display-flex flex-row customize-scroll-bar"
                                        style={{ height: "110px" }}>
                                        <NftCardSmall singleNftInfo={{ imgUrl: "imgs/front/nfts/mogul.png", name: "Mogul", nftCount: walletNftInfo.mogulCount }} />
                                        <NftCardSmall singleNftInfo={{ imgUrl: "imgs/front/nfts/investor.png", name: "Investor", nftCount: walletNftInfo.investorCount }} />
                                    </div>
                                    <div className="width-100 display-flex flex-row item-center mt-1" style={{ alignItems: 'center', justifyContent: 'space-around' }}>
                                        <Button className="button-style1" style={{ width: "160px" }} onClick={handleLogin} >Log in to Degenland</Button>
                                        <Button className="button-style1" style={{ width: "160px" }} onClick={handleMarketplaceLogin} >Log in to Marketplace</Button>
                                    </div>
                                </div>
                            }
                        </div>
                    }
                    {
                        accountIds?.length > 0 &&
                        pageStatus === PAGE_STATUS[1] &&
                        <div>
                            <div className="width-100 display-flex flex-row item-center mt-1">
                                <Upload onDrop={files => { setUploadFile(files) }} />
                            </div>
                            <div className="width-100 display-flex flex-row item-center mt-1">
                                <AccountInputTap
                                    value={newPlayerId}
                                    onChange={(event) => {
                                        setNewPlayerId(event.target.value.toLowerCase());
                                    }}
                                    placeholder="Player ID"
                                />
                            </div>
                            <div className="width-100 display-flex flex-row mt-1 customize-scroll-bar"
                                style={{ height: "110px" }}>
                                <NftCardSmall singleNftInfo={{ imgUrl: "imgs/front/nfts/degenland.png", name: "Degen", nftCount: walletNftInfo.degenlandCount }} />
                                <NftCardSmall singleNftInfo={{ imgUrl: "imgs/front/nfts/tycoon.png", name: "Tycoon", nftCount: walletNftInfo.tycoonCount }} />
                            </div>
                            <div className="width-100 display-flex flex-row customize-scroll-bar"
                                style={{ height: "110px" }}>
                                <NftCardSmall singleNftInfo={{ imgUrl: "imgs/front/nfts/mogul.png", name: "Mogul", nftCount: walletNftInfo.mogulCount }} />
                                <NftCardSmall singleNftInfo={{ imgUrl: "imgs/front/nfts/investor.png", name: "Investor", nftCount: walletNftInfo.investorCount }} />
                            </div>
                            <div className="width-100 display-flex flex-row item-center mt-1">
                                <Button
                                    className="button-style1 mr-4"
                                    style={{ width: "160px" }}
                                    onClick={() => onClickCreateNewPlayer()}>
                                    Create
                                </Button>
                                <Button
                                    className="button-style1 ml-4"
                                    style={{ width: "160px" }}
                                    onClick={() => { setPageStatus(PAGE_STATUS[0]) }}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    }
                </div>
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
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loadingView}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <ToastContainer autoClose={5000} draggableDirection="x" />
        </>
    );
}
export default Login;
