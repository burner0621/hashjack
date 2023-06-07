import React, { useRef, useState, useEffect } from "react";
import { connect, useDispatch, useSelector } from 'react-redux';
import { useHistory } from "react-router-dom";

import axios from "axios";
import io from "socket.io-client";

import * as env from "../../env";
import "./style.scss";
import '../../assets/css/styles';

import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Backdrop from '@mui/material/Backdrop';
import Tabs, { tabsClasses } from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import Dialog from '@mui/material/Dialog';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';

import Image from 'mui-image';

import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TerrainIcon from '@mui/icons-material/Terrain';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import ForestIcon from '@mui/icons-material/Forest';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import LockIcon from '@mui/icons-material/Lock';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import WeekendIcon from '@mui/icons-material/Weekend';

import MainMenu from "../../components/MainMenu";
import PlayerInfoDlg from "../../components/PlayerInfoDlg";
import PlaceDetailDlg from "../../components/PlaceDetailDlg";
import BuildingInfoDlg from "../../components/BuildingInfoDlg";
import AdvertisementDlg from "../../components/AdvertisementDlg";

import { Button, Grid } from '@mui/material';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useHashConnect } from "../../assets/api/HashConnectAPIProvider.tsx";
import EmojiIcon from '../../components/Icon/EmojiIcon';
import { getRequest, postRequest } from "../../assets/api/apiRequests";

//Phaser
import Game from "../Phaser/Game";

//actions
import { setSceneName } from '../../actions/scene';
import { selectNFT, nftListChange, setWalletNftList } from '../../actions/nft';
import { handlePlaceDetailDialog, setTeleportData, clearTeleportData } from '../../actions/placeinfo';
import { setPlayerInfo, calculateLevel, updatePlayerInfo, setPalBalance, setDancing, setBuildingState, setVisitPlace } from '../../actions/playerinfo';
import { setChatContent, setEmoji, addChatHistory } from '../../actions/chat';
import { setGround, setRoad, setBuilding, setObject, setHouseInfo, setHouse } from '../../actions/construction';
import { setFriend, hideFriendInfoDlg } from '../../actions/friendinfo';
import { loadNotification } from '../../actions/notification';
import { loadFriendList } from '../../actions/friends';
import { moveToFriend } from '../../actions/friends';
import { selectMusic, setMusicChanged, setMute, setVolumeChanged, setVolume } from "../../actions/music";
import { setEntered, clearData, setGoOut, getTicket, setAds } from "../../actions/buildinginfo";
import { fontWeight } from "@mui/system";

const TOTAL_MAP = "total-map";
const SINGLE_MAP = "single-map";
const EDIT_MAP = "edit-map";
const HOUSE_MAP = "house-map";

const MAP_TYPE = [TOTAL_MAP, SINGLE_MAP, EDIT_MAP, HOUSE_MAP];

const PAL_DECIMAL = 8;

//phaser
const groundTileInfo = [];
const roadTileInfo = [];
const objectTileInfo = [];

let player = null;

const socket = io.connect(env.SERVER_URL, { autoConnect: true });

let inviteInfoId = undefined;
let clearAcceptedNotificationId = undefined;
let alertAcceptedId = undefined;
let clearDeclinedNotificationId = undefined;
let alertDeclinedId = undefined;
let receivePrivateMsgId = undefined;
let successSendOfferId = undefined;
let successAcceptOfferId = undefined;
let alertOfferAcceptedId = undefined;
let successDeclineOfferId = undefined;
let alertOfferApprovedId = undefined;

function Main(props) {
    const { walletData, sendPALToTreasury, autoAssociate } = useHashConnect();
    const { accountIds } = walletData;
    const [socketState, setSocketState] = useState(null);
    const [advertisementId, setAdvertisementId] = useState(null);

    /**
     * socket communication
     */

    //Refresh notification after accept
    socket.on('inviteSuccess', (inviteInfo, id) => {
        if (inviteInfoId != id) {
            inviteInfoId = id;
            props.loadNotification(inviteInfo.accountId);
        }
    });

    //Refresh notification after accept
    socket.on('clearAcceptedNotification', (id, notificationId) => {
        if (clearAcceptedNotificationId != notificationId) {
            clearAcceptedNotificationId = notificationId;
            props.updatePlayerInfo(id);
            props.loadNotification(id);
        }
    });

    //Alert declined notification
    socket.on('alertAccepted', (id, notificationId) => {
        if (alertAcceptedId != notificationId) {
            alertAcceptedId = notificationId;
            props.loadFriendList(id);
            props.updatePlayerInfo(id);
            //props.calculateLevel(playerinfoStore.data.accountId);
            props.loadNotification(id);
        }
    });

    //Refresh notification after decline
    socket.on('clearDeclinedNotification', (id, notificationId) => {
        if (clearDeclinedNotificationId != notificationId) {
            clearDeclinedNotificationId = notificationId;
            console.log("clearDeclinedNotification");
            props.loadNotification(id);
        }
    });

    //Alert declined notification
    socket.on('alertDeclined', (id, notificationId) => {
        if (alertDeclinedId != notificationId) {
            alertDeclinedId = notificationId;
            console.log("alertDeclined");
            props.loadNotification(id);
        }
    });

    //Receive private message
    socket.on('receivePrivateMsg', (msgInfo, val) => {
        if (receivePrivateMsgId != msgInfo._id) {
            receivePrivateMsgId = msgInfo._id;
            console.log("receivePrivateMsg");
            props.loadNotification(msgInfo.accountId);
        }
    });

    /** Receive new nft swap offer */
    socket.on('successSendOffer', (id, notificationId) => {
        if (successSendOfferId != notificationId) {
            successSendOfferId = notificationId;
            console.log("successSendOffer");
            props.loadNotification(id);
        }
    });

    //Refresh notification after accept offer
    socket.on('successAcceptOffer', (id, notificationId) => {
        if (successAcceptOfferId != notificationId) {
            successAcceptOfferId = notificationId
            console.log("successAcceptOffer");
            props.loadNotification(id);
        }
    });

    //Alert accepted offer
    socket.on('alertOfferAccepted', (id, notificationId) => {
        if (alertOfferAcceptedId != notificationId) {
            alertOfferAcceptedId = notificationId;
            console.log("alertOfferAccepted");
            props.loadNotification(id);
        }
    });

    //Refresh notification after decline offer
    socket.on('successDeclineOffer', (id, notificationId) => {
        if (successDeclineOfferId != notificationId) {
            successDeclineOfferId = notificationId;
            console.log("successDeclineOffer");
            props.loadNotification(id);
        }
    });

    //Alert accepted offer
    socket.on('alertOfferApproved', (id, notificationId) => {
        if (alertOfferApprovedId != notificationId) {
            alertOfferApprovedId = notificationId;
            console.log("alertOfferApproved");
            props.loadNotification(id);
        }
    });

    // reward notification
    socket.on('getReward', async () => {
        const socketData = {
            socketState: 'getReward'
        };
        setSocketState(socketData);
    });

    // friend login notification
    socket.on('friendLogin', async (playerId) => {
        const socketData = {
            socketState: 'friendLogin',
            socketPlayerId: playerId
        };
        setSocketState(socketData);
    });

    // friend logout notification
    socket.on('friendLogout', async (playerId) => {
        const socketData = {
            socketState: 'friendLogout',
            socketPlayerId: playerId
        };
        setSocketState(socketData);
    });

    // billboard construct
    socket.on('setAdvertisement', async (buildingId) => {
        const socketData = {
            socketState: 'setAdvertisement',
            socketAdvertisementId: buildingId
        };
        setSocketState(socketData);
    });

    // house construct
    socket.on('setHouseConstruct', async (buildingInfo) => {
        const socketData = {
            socketState: 'setHouseConstruct',
            socketBuildingInfo: buildingInfo
        };
        setSocketState(socketData);
    });

    useEffect(() => {
        if (socketState != null) {
            if (socketState.socketState == 'getReward') {
                props.loadNotification(accountIds[0]);
                setSocketState(null);
            }
            else if (socketState.socketState == 'friendLogin') {
                toast.info(socketState.socketPlayerId + " is login!");
                setSocketState(null);
            }
            else if (socketState.socketState == 'friendLogout') {
                toast.info(socketState.socketPlayerId + " is logout!");
                setSocketState(null);
            }
            else if (socketState.socketState == 'setAdvertisement') {
                setAdvertisementDlgViewFlag(true);
                setAdvertisementId(socketState.socketAdvertisementId);
                setSocketState(null);
            }
            else if (socketState.socketState == 'setHouseConstruct') {
                props.setHouseInfo(socketState.socketBuildingInfo);
                setSocketState(null);
            }
        }
    }, [socketState]);

    const [loadingView, setLoadingView] = useState(false);
    const [refreshFlag, setRefreshFlag] = useState(false);

    const [loginFlag, setLoginFlag] = useState(false);
    const [playerInfo, setPlayerInfo] = useState(null);

    //chat
    const [chatStr, setChatStr] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [dancingSelected, setDancingSelected] = useState(false);

    const [walletNftInfo, setWalletNftInfo] = useState([]);
    const [walletNftCount, setWalletNftCount] = useState({});
    // My token balance
    const [palBalanceInfo, setPalBalanceInfo] = useState(0);

    // Famous place data
    const [famousPlaceInfo, setFamousPlaceInfo] = useState(null);

    const [currentLandInfo, setCurrentLandInfo] = useState(null);

    const [selectedLandTabNo, setSelectedLand] = useState(0);
    const [currentMap, setCurrentMap] = useState(MAP_TYPE[0]);

    const [drawMapToolValue, setDrawMapToolValue] = React.useState(0);

    const [alertMenuAnchor, setAlertMenuAnchor] = useState(null);
    const alertMenuOpenFlag = Boolean(alertMenuAnchor);

    const onClickAlertBtn = (event) => {
        setAlertMenuAnchor(event.currentTarget);
    };
    const alertMenuClose = () => {
        setAlertMenuAnchor(null);
    };

    const onChangeDrawMapTool = (event, newValue) => {
        setDrawMapToolValue(newValue);
    };

    const onChangeSelectedLandTabNo = (event, newValue) => {
        setSelectedLand(newValue);
    };

    useEffect(() => {
        if (accountIds?.length > 0) {
            socket.emit("map", accountIds[0]);
            setLoadingView(true);
            setLoginFlag(false);

            getFamousPlace();
            getWalletBalance(accountIds[0]);
            props.setSceneName("totalmap");

            getPlayerInfo(accountIds[0]);
            getWalletMyNftData(accountIds[0]);
        }
    }, [accountIds]);

    //--------------------------------------------------------------------------------------------------

    const getFamousPlace = async () => {
        const _famousPlaceData = await getInfoResponse(env.SERVER_URL + '/api/place/get_famous_place');
        if (!_famousPlaceData) {
            toast.error("Something wrong with server!");
            setLoadingView(false);
            return;
        }
        setFamousPlaceInfo(_famousPlaceData.data.data);
    }

    const getPlayerInfo = async (accountId_) => {
        console.log("getPlayerInfo log - 1: ", accountId_);
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
        player = g_playerInfo.data.data;

        console.log("getPlayerInfo", g_playerInfo.data.data);
        setPlayerInfo(g_playerInfo.data.data);
        setLoginFlag(true);
    }

    const getWalletMyNftData = async (accountId_) => {
        let _nextLink = null;
        let _newWalletNftInfo = [];
        let _newWalletNftCount = {
            degenlandCount: 0,
            tycoonCount: 0,
            mogulCount: 0,
            investorCount: 0
        };

        let _WNinfo = await getInfoResponse(env.MIRROR_NET_URL + "/api/v1/accounts/" + accountId_ + "/nfts");
        if (!_WNinfo) {
            toast.error("Something wrong with network!");
            setLoadingView(false);
            return;
        }

        if (_WNinfo && _WNinfo.data.nfts.length > 0)
            _nextLink = _WNinfo.data.links.next;

        while (1) {
            let _tempNftInfo = _WNinfo.data.nfts;
            let placeInfo = await axios.get(env.SERVER_URL + "/api/place/get_places_info?nftInfo=" + JSON.stringify(_tempNftInfo));

            for (let i = 0; i < _tempNftInfo.length; i++) {
                if (_tempNftInfo[i].token_id === env.DEGENLAND_NFT_ID ||
                    _tempNftInfo[i].token_id === env.TYCOON_NFT_ID ||
                    _tempNftInfo[i].token_id === env.MOGUL_NFT_ID ||
                    _tempNftInfo[i].token_id === env.INVESTOR_NFT_ID) {

                    if (_tempNftInfo[i].token_id === env.DEGENLAND_NFT_ID) {
                        _newWalletNftCount.degenlandCount += 1;
                    } else if (_tempNftInfo[i].token_id === env.TYCOON_NFT_ID) {
                        _newWalletNftCount.tycoonCount += 1;
                    } else if (_tempNftInfo[i].token_id === env.MOGUL_NFT_ID) {
                        _newWalletNftCount.mogulCount += 1;
                    } else if (_tempNftInfo[i].token_id === env.INVESTOR_NFT_ID) {
                        _newWalletNftCount.investorCount += 1;
                    }

                    //get land nft info here
                    let g_buildCount = 0;
                    let g_currentVisitor = 0;

                    for (let j = 0; j < placeInfo.data.data.length; j++) {
                        if (_tempNftInfo[i].token_id == placeInfo.data.data[j].token_id && _tempNftInfo[i].serial_number == placeInfo.data.data[j].serial_number) {
                            g_buildCount = placeInfo.data.data[j].buildingCount;
                            g_currentVisitor = placeInfo.data.data[j].currentVisitor;
                        }
                    }


                    _newWalletNftInfo.push({
                        tokenId: _tempNftInfo[i].token_id,
                        serialNum: _tempNftInfo[i].serial_number,
                        buildingCount: g_buildCount,
                        currentVisitor: g_currentVisitor
                    })
                }
            }

            if (!_nextLink || _nextLink === null) break;

            _WNinfo = await getInfoResponse(env.MIRROR_NET_URL + _nextLink);
            _nextLink = null;
            if (_WNinfo && _WNinfo.data.nfts.length > 0)
                _nextLink = _WNinfo.data.links.next;
        }

        setWalletNftInfo(_newWalletNftInfo);
        setWalletNftCount(_newWalletNftCount);
        props.setWalletNftList(_newWalletNftInfo);
        setRefreshFlag(!refreshFlag);
    }

    const changeToRealValue = (value_, decimal_) => {
        return parseFloat(value_ / (10 ** decimal_)).toFixed(3);
    }

    const getWalletBalance = async (accountId_) => {
        let g_palBalance;

        const g_palBalanceInfo = await getInfoResponse(`${env.MIRROR_NET_URL}/api/v1/accounts/${accountId_}/tokens?token.id=${env.PAL_TOKEN_ID}`);
        if (!g_palBalanceInfo) {
            toast.error("Something wrong with network!");
            setLoadingView(false);
            return;
        }

        if (g_palBalanceInfo.data.tokens?.length == 0)
            g_palBalance = 0;
        else
            g_palBalance = g_palBalanceInfo.data.tokens[0].balance;

        setPalBalanceInfo(parseInt(changeToRealValue(g_palBalance, PAL_DECIMAL), 10));

        await props.setPalBalance(parseInt(changeToRealValue(g_palBalance, PAL_DECIMAL), 10));
    }

    const getPalBalance = async (accountId_) => {
        let g_palBalance;

        const g_palBalanceInfo = await getInfoResponse(`${env.MIRROR_NET_URL}/api/v1/accounts/${accountId_}/tokens?token.id=${env.PAL_TOKEN_ID}`);
        if (!g_palBalanceInfo) {
            toast.error("Something wrong with network!");
            setLoadingView(false);
            return;
        }

        if (g_palBalanceInfo.data.tokens?.length == 0)
            g_palBalance = 0;
        else
            g_palBalance = g_palBalanceInfo.data.tokens[0].balance;

        await props.setPalBalance(parseInt(changeToRealValue(g_palBalance, PAL_DECIMAL), 10));
        console.log("parseInt(changeToRealValue(g_palBalance, PAL_DECIMAL), 10);", parseInt(changeToRealValue(g_palBalance, PAL_DECIMAL), 10));
        return parseInt(changeToRealValue(g_palBalance, PAL_DECIMAL), 10);
    }

    const associateCheck = async (accountId, tokenId) => {
        try {
            const associateInfo = await getInfoResponse(`${env.MIRROR_NET_URL}/api/v1/accounts/${accountId}/tokens?token.id=${tokenId}`);

            // already associated
            if (associateInfo.data.tokens?.length > 0)
                return { result: true, associated: true };

            return { result: true, associated: false };
        } catch (error) {
            return { result: false, error: error.message };
        }
    }

    //--------------------------------------------------------------------------------------------------

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

    //---------------------------------------------------------------------------------------------------
    // phaser
    let history = useHistory();

    // Place Detail Dialog open flag
    const [open, setOpen] = useState(false);
    const [placeDetailDlgViewFlag, setPlaceDetailDlgViewFlag] = useState(false)
    const [buildingInfoDlgViewFlag, setBuildingInfoDlgViewFlag] = useState(false);
    const [advertisementDlgViewFlag, setAdvertisementDlgViewFlag] = useState(false);
    const [playerInfoDlgOpen, setPlayerInfoDlgOpen] = useState(false);

    // Friend Info
    const [friendInfo, setFriendInfo] = useState({
        accountId: "",
        playerId: "",
        avatarUrl: "",
        level: 1,
        levelProcess: 0,
        connectState: true,
        isfriend: false,
        isinvited: false,
        degenlandCount: 0,
        tycoonCount: 0,
        mogulCount: 0,
        investorCount: 0,
    });
    //    let buildingInfo = undefined;

    const sceneStore = useSelector(state => state.scene);
    const placeStore = useSelector(state => state.placeinfo);
    const playerInfoStore = useSelector(state => state.playerinfo);
    const friendStore = useSelector(state => state.friendinfo);
    const chatStore = useSelector(state => state.chat);
    const buildingcounterStore = useSelector(state => state.buildingcounter);
    const buildingStore = useSelector(state => state.buildinginfo);
    const constructionStore = useSelector(state => state.construction);
    const nftStore = useSelector(state => state.nft);
    const friendsStore = useSelector(state => state.friends);

    //entered building info
    const [enteredBuildingInfo, setEnteredBuildingInfo] = useState({});
    const [ownerInfo, setOwnerInfo] = useState({});

    // accordion
    const [expanded, setExpanded] = useState('popular places');

    //locked and unlocked building info
    const [buildingInfo, setBuildingInfo] = useState(null);
    const [houseInfo, setHouseInfo] = useState(null);

    const [showCounter, setShowCounter] = useState(false);
    //Counter
    const [days, setDays] = useState(0);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);

    // Complete image loading
    useEffect(() => {
        //Success loading
        if (sceneStore.loading == true) {
            setLoadingView(false);
        }

        //Set main page
        if (sceneStore.scenename == 'totalmap') {
            if (player != null) {
                props.setPlayerInfo(player);
                props.loadNotification(player.accountId);
                //calculate level
                props.calculateLevel(player.accountId);
            }
            setCurrentMap(MAP_TYPE[0]);
        }
        //Set view mode
        else if (sceneStore.scenename == 'view' || sceneStore.scenename == 'visit') {
            setCurrentMap(MAP_TYPE[1]);
            // const _address = placeStore.data.address;
            // const _pos = placeStore.data.pos;
            // props.getTicket(_address, _pos);
        }
        //Set construction mode
        else if (sceneStore.scenename == 'construction') {
            setCurrentMap(MAP_TYPE[2]);
            const _address = placeStore.data.address;
            const _pos = placeStore.data.pos;
            props.getTicket(_address, _pos);
        }
        //Set house construction mode
        else if (sceneStore.scenename == 'buildingConstruct') {
            setCurrentMap(MAP_TYPE[3]);
        }
    }, [sceneStore]);

    // Visit place
    useEffect(() => {
        if (playerInfoStore.visitPlace != null) {
            setCurrentMap(MAP_TYPE[1]);
            props.setVisitPlace(null);
        }
    }, [playerInfoStore.visitPlace]);

    // Update player info
    useEffect(() => {
        if (playerInfoStore.data != null)
            setPlayerInfo(playerInfoStore.data);
    }, [playerInfoStore.data]);

    // show building info dialog
    useEffect(() => {
        if (buildingStore.buildingId != null) {
            if (buildingStore.buildingInfo.index == 26) {
                const _address = placeStore.data.address;
                const _pos = placeStore.data.pos;
                props.getTicket(_address, _pos);
                setEnteredBuildingInfo(buildingStore.buildingInfo);
                setOwnerInfo(buildingStore.ownerInfo);
                setBuildingInfoDlgViewFlag(true);
            }
        }
    }, [buildingStore.buildingId]);

    // Click ads button
    /*    useEffect(() => {
            if (constructionStore.ads_show == true)
                setPlaceDetailDlgViewFlag(true);
        }, [constructionStore.ads_show]);*/

    useEffect(() => {
        if (playerInfoStore.buildingState != null) {
            console.log(playerInfoStore.buildingState);
            let buildingTileInfo = [];
            buildingInfo.map((item, index) => {
                buildingTileInfo.push(item);
            });
            playerInfoStore.buildingState.map((item, index) => {
                for (let i = 0; i < buildingTileInfo.length; i++) {
                    if (item.index == buildingTileInfo[i].index)
                        buildingTileInfo[i].canBuild = true;
                }
            });
            setBuildingInfo(buildingTileInfo);

            let houseTileInfo = [];
            houseInfo.map((item, index) => {
                houseTileInfo.push(item);
            });
            playerInfoStore.buildingState.map((item, index) => {
                for (let i = 0; i < houseTileInfo.length; i++) {
                    if (item.index == houseTileInfo[i].index)
                        houseTileInfo[i].canBuild = true;
                }
            });
            setHouseInfo(houseTileInfo);
        }
    }, [playerInfoStore.buildingState]);

    // Complete loading building images
    useEffect(() => {
        if (sceneStore.buildingimages != null) {
            let budInfo = sceneStore.buildingimages;
            let buildingTileInfo = [];
            let furnitureTileInfo = [];
            for (let i = 0; i < budInfo.length; i++) {
                if (budInfo[i].type == "ground")
                    groundTileInfo.push(budInfo[i].url);
                else if (budInfo[i].type == "road")
                    roadTileInfo.push(budInfo[i].url);
                else if (budInfo[i].type == "building") {
                    let buildingData = {};
                    if (accountIds[0] == '0.0.1690607') {
                        buildingData = {
                            index: budInfo[i].index,
                            cost: budInfo[i].cost,
                            url: budInfo[i].url,
                            canBuild: true
                        }
                    }
                    else {
                        if (budInfo[i].cost == 0) {
                            buildingData = {
                                index: budInfo[i].index,
                                cost: budInfo[i].cost,
                                url: budInfo[i].url,
                                canBuild: true
                            }
                        }
                        else {
                            if (budInfo[i].index == 26) {
                                buildingData = {
                                    index: budInfo[i].index,
                                    cost: budInfo[i].cost,
                                    url: budInfo[i].url,
                                    canBuild: true
                                }
                            }
                            else {
                                buildingData = {
                                    index: budInfo[i].index,
                                    cost: budInfo[i].cost,
                                    url: budInfo[i].url,
                                    canBuild: false
                                }
                            }
                        }
                    }
                    buildingTileInfo.push(buildingData);
                }
                else if (budInfo[i].type == "object")
                    objectTileInfo.push(budInfo[i].url);
                else if (budInfo[i].type == "furniture") {
                    let furnitureData = {
                        index: budInfo[i].index,
                        cost: budInfo[i].cost,
                        url: budInfo[i].url,
                        canBuild: false
                    };
                    furnitureTileInfo.push(furnitureData);
                }
            }
            setBuildingInfo(buildingTileInfo);
            setHouseInfo(furnitureTileInfo);
        }
    }, [sceneStore.buildingimages]);

    // Load place info
    useEffect(() => {
        if (placeStore.data != null && placeStore.show == true) {
            let placeinfo = placeStore.data;
            setCurrentLandInfo({
                tokenId: placeinfo.token_id,
                serialNum: placeinfo.serialNumber,
                ownerInfo: placeinfo.ownerInfo,
                buildingCount: placeinfo.buildingCount,
                customerCount: placeinfo.currentVisitor,
                landBalance: placeinfo.score,
                totalCustomer: placeinfo.totalVisitor
            });
            setPlaceDetailDlgViewFlag(true);
        }
        /*
                if (placeStore.data != null && placeStore.show == true) {
                    console.log(friendsStore.moveToFriend);
                    let placeinfo = placeStore.data;
                    setCurrentLandInfo({
                        tokenId: placeinfo.token_id,
                        serialNum: placeinfo.serialNumber,
                        ownerInfo: placeinfo.ownerInfo,
                        buildingCount: placeinfo.buildingCount,
                        customerCount: placeinfo.currentVisitor,
                        landBalance: placeinfo.score,
                        totalCustomer: placeinfo.totalVisitor
                    });
                    if (friendsStore.moveToFriend == null)
                        setPlaceDetailDlgViewFlag(true);
                    else {
                        props.moveToFriend(null);
                        props.handlePlaceDetailDialog(false);
                    }
                }*/
    }, [placeStore.data]);

    // teleport friend
    useEffect(() => {
        if (placeStore.teleportData != null) {
            let placeinfo = placeStore.teleportData;
            setCurrentLandInfo({
                tokenId: placeinfo.token_id,
                serialNum: placeinfo.serialNumber,
                ownerInfo: placeinfo.ownerInfo,
                buildingCount: placeinfo.buildingCount,
                customerCount: placeinfo.currentVisitor,
                landBalance: placeinfo.score,
                totalCustomer: placeinfo.totalVisitor
            });
            props.clearTeleportData();
        }
    }, [placeStore.teleportData]);

    // load new customer count
    useEffect(() => {
        if (placeStore.data != null) {
            let placeinfo = placeStore.data;
            setCurrentLandInfo({
                tokenId: placeinfo.token_id,
                serialNum: placeinfo.serialNumber,
                owner: placeinfo.owner,
                avatarUrl: placeinfo.avatarUrl,
                buildingCount: placeinfo.buildingCount,
                customerCount: placeStore.customer,
                landBalance: placeinfo.score,
                totalCustomer: placeinfo.totalVisitor
            });
        }
    }, [placeStore.customer]);

    // Complete image loading
    useEffect(() => {
        if (placeStore.show == true) {
            //            setOpen(true);
        }
    }, [placeStore.show]);

    // Get building remain time
    useEffect(() => {
        console.log(buildingcounterStore.remaintime);
        setSeconds(buildingcounterStore.remaintime);
        /*        setDays(Math.floor(distance / (day)));
                setHours(Math.floor((distance % (day)) / (hour)));
                setMinutes(Math.floor((distance % (hour)) / (minute)));
                setSeconds(Math.floor((distance % (minute)) / second));*/

    }, [buildingcounterStore.remaintime]);

    // Show counter
    useEffect(() => {
        if (buildingcounterStore.show == true)
            setShowCounter(true);
    }, [buildingcounterStore.show]);

    //Get Wallet NFT count from mirror node
    const setPlayerInfoDlg = async (accountId_) => {
        const resData = await getInfoResponse(env.SERVER_URL + "/api/account/get_player_nft_count?accountId=" + friendStore.data.accountId);
        const nftCount = resData.data.data;
        //Check friendlist
        let friendflag = false;
        let friendList = friendStore.data.friendList;
        for (let i = 0; i < friendList.length; i++) {
            if (accountIds[0] == friendList[i])
                friendflag = true;
        }

        setFriendInfo({
            accountId: friendStore.data.accountId,
            playerId: friendStore.data.playerId,
            avatarUrl: friendStore.data.avatarUrl,
            level: friendStore.data.level,
            levelProcess: (friendStore.data.currentLevelScore / friendStore.data.targetLevelScore) * 100,
            connectState: friendStore.data.connectState,
            isfriend: friendflag,
            isinvited: friendStore.isinvited,
            degenlandCount: nftCount.degenlandCount,
            tycoonCount: nftCount.tycoonCount,
            mogulCount: nftCount.mogulCount,
            investorCount: nftCount.investorCount
        });
        setPlayerInfoDlgOpen(true);
    }

    // When click player
    useEffect(() => {
        if (friendStore.showdlg == true && accountIds[0] != friendStore.data.accountId)
            setPlayerInfoDlg(friendStore.data.accountId);
    }, [friendStore]);

    useEffect(() => {
        if (chatStore.chatInfo != null) {
            let chatInfo = chatStore.chatInfo;
            const chatItem = {
                playerId: chatInfo.playerId,
                avatarUrl: chatInfo.avatarUrl,
                chatStr: chatInfo.chatStr
            }
            addChatToList(chatItem);
        }
    }, [chatStore.chatInfo]);

    const handleAdsClose = () => {
    }

    // When click NFT
    const handlewalletNft = (tokenId, serialNum) => {
        let selectedNft;
        if (tokenId == env.DEGENLAND_NFT_ID)
            selectedNft = "Degen-" + serialNum;
        else if (tokenId == env.TYCOON_NFT_ID)
            selectedNft = "Tycoon-" + serialNum;
        else if (tokenId == env.MOGUL_NFT_ID)
            selectedNft = "Mogul-" + serialNum;
        else
            selectedNft = "Investor-" + serialNum;
        props.selectNFT(selectedNft);
    }

    /* -------------------------------------------handle-----------------------------------------------------*/
    //-------------------dialog handle------------------

    const handleMouseDown = (e) => {
        e.stopPropagation();
    }

    const handleMouseUp = (e) => {
        e.stopPropagation();
    }

    //------------------chat handle-----------------
    const onSendClick = (e) => {
        props.setChatContent(chatStr);
        const chatItem = {
            playerId: playerInfo.playerId,
            avatarUrl: env.SERVER_URL + playerInfo?.avatarUrl,
            chatStr: e.target.value
        }
        addChatToList(chatItem);
        setChatStr("");
    };

    const onChatkeyPress = (e) => {
        if (e.key == 'Enter') {
            props.setChatContent(e.target.value);
            const chatItem = {
                playerId: playerInfo.playerId,
                avatarUrl: env.SERVER_URL + playerInfo?.avatarUrl,
                chatStr: e.target.value
            }
            addChatToList(chatItem);
            setChatStr("");
        }
    };

    const addChatToList = (chatItem) => {
        let chatList = chatHistory;
        chatList.unshift(chatItem);
        setChatHistory(chatList);
    }

    const _handleEmojiPicked = (emoji) => {
        props.setEmoji(emoji);
    }

    //------------------construction---------------
    const onClickgroundTile = (index_) => {
        props.setRoad(-1);
        props.setBuilding(-1);
        props.setObject(-1);
        props.setGround(index_);
    }

    const onClickroadTile = (index_) => {
        props.setGround(-1);
        props.setBuilding(-1);
        props.setObject(-1);
        props.setRoad(index_ + 1);
    }

    const onClickbuildingTile = async (item_, index_) => {
        if (item_.canBuild == true) {
            props.setGround(-1);
            props.setRoad(-1);
            props.setObject(-1);
            props.setBuilding(index_ + 1);
        }
        else {
            const palBalance = await getPalBalance(accountIds[0]);
            let result = window.confirm('Do you unlock this building?');
            if (result) {
                setLoadingView(true);
                // associate check
                const getResult = await associateCheck(accountIds[0], env.PAL_TOKEN_ID);
                if (!getResult.result) {
                    toast.error(getResult.error);
                    setLoadingView(false);
                    return;
                }

                // auto associate
                if (getResult.associated == false) {
                    const _associateResult = await autoAssociate();

                    if (!_associateResult) {
                        setLoadingView(false);
                        toast.error("something wrong with associate!");
                        return false;
                    }
                }

                if (palBalance < item_.cost) {
                    toast.error("Insufficient PAL balance!");
                    setLoadingView(false);
                    return;
                }
                else {
                    setLoadingView(false);
                    const _approveResult = await sendPALToTreasury(item_.cost);

                    if (!_approveResult) {
                        toast.error("something wrong with approve!");
                        return false;
                    }

                    // approve success
                    setLoadingView(true);
                    const approvePostData = {
                        a: btoa(placeStore.data.address),
                        b: btoa(placeStore.data.pos),
                        c: btoa(accountIds[0]),
                        d: btoa(item_.index),
                        e: btoa(item_.cost),
                        f: btoa(playerInfoStore.data.playerId)
                    }
                    const _approvePostResult = await postRequest(env.SERVER_URL + "/api/stake/buy_building", approvePostData);
                    if (!_approvePostResult) {
                        toast.error("Something wrong with server!");
                        setLoadingView(false);
                        return;
                    }
                    if (!_approvePostResult.result) {
                        toast.error(_approvePostResult.error);
                        setLoadingView(false);
                        return false;
                    }
                    setLoadingView(false);
                    toast.success("unlock success!");
                    await props.setBuildingState(btoa(placeStore.data.address), btoa(placeStore.data.pos), btoa(accountIds[0]));
                    await props.calculateLevel(accountIds[0]);
                    await getWalletBalance(accountIds[0]);
                }
            }
        }
    }

    const onClickhouseTile = async (item_, index_) => {
        if (item_.canBuild == true)
            props.setHouse(index_ + 1);
        else {
            const palBalance = await getPalBalance(accountIds[0]);
            let result = window.confirm('Do you unlock this building?');
            if (result) {
                setLoadingView(true);
                // associate check
                const getResult = await associateCheck(accountIds[0], env.PAL_TOKEN_ID);
                if (!getResult.result) {
                    toast.error(getResult.error);
                    setLoadingView(false);
                    return;
                }

                // auto associate
                if (getResult.associated == false) {
                    const _associateResult = await autoAssociate();

                    if (!_associateResult) {
                        setLoadingView(false);
                        toast.error("something wrong with associate!");
                        return false;
                    }
                }

                if (palBalance < item_.cost) {
                    toast.error("Insufficient PAL balance!");
                    setLoadingView(false);
                    return;
                }
                else {
                    setLoadingView(false);
                    const _approveResult = await sendPALToTreasury(item_.cost);

                    if (!_approveResult) {
                        toast.error("something wrong with approve!");
                        return false;
                    }

                    // approve success
                    setLoadingView(true);
                    const approvePostData = {
                        a: btoa(placeStore.data.address),
                        b: btoa(placeStore.data.pos),
                        c: btoa(accountIds[0]),
                        d: btoa(item_.index),
                        e: btoa(item_.cost),
                        f: btoa(playerInfoStore.data.playerId)
                    }
                    const _approvePostResult = await postRequest(env.SERVER_URL + "/api/stake/buy_building", approvePostData);
                    if (!_approvePostResult) {
                        toast.error("Something wrong with server!");
                        setLoadingView(false);
                        return;
                    }
                    if (!_approvePostResult.result) {
                        toast.error(_approvePostResult.error);
                        setLoadingView(false);
                        return false;
                    }
                    setLoadingView(false);
                    toast.success("unlock success!");
                    await props.setBuildingState(btoa(placeStore.data.address), btoa(placeStore.data.pos), btoa(accountIds[0]));
                    await props.calculateLevel(accountIds[0]);
                    await getWalletBalance(accountIds[0]);
                }
            }
        }
    }
    const onClickobjectTile = (index_) => {
        props.setGround(-1);
        props.setRoad(-1);
        props.setBuilding(-1);
        props.setObject(index_ + 1);
    }

    const changeToValue = (value_) => {
        let k_value = value_ / 1000;
        if (k_value < 1000)
            return k_value + 'K';
        else
            return k_value / 1000 + 'M';
    }

    return (
        <>
            <div className="main-container">
                <Game socket={socket} />
                <MainMenu props={props} socket={socket} />
                {
                    playerInfo != null &&
                    <div className="account-info" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                        <Avatar
                            className="account-avatar"
                            src={env.SERVER_URL + playerInfo?.avatarUrl}
                            sx={{ width: 82, height: 82 }}
                        />
                        <div className="account-info-str">
                            <p>{playerInfo.playerId}</p>
                            <LinearProgress style={{ marginBottom: 5 }} variant='determinate' value={(playerInfo.currentLevelScore / playerInfo.targetLevelScore) * 100} />
                            <p style={{
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: '700',
                                color: '#1976d2'
                            }}>
                                Level : {playerInfo.level}
                            </p>
                        </div>
                    </div>
                }
                {
                    currentMap === TOTAL_MAP && (famousPlaceInfo?.length > 0 || walletNftInfo?.length > 0) &&
                    <div className="total-map-wrapper">
                        <Tabs
                            className="lands-wrapper"
                            value={false}
                            orientation="vertical"
                            onChange={onChangeSelectedLandTabNo}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            variant="scrollable"
                            scrollButtons
                            aria-label="visible arrows tabs example"
                            sx={{
                                [`& .${tabsClasses.scrollButtons}`]: {
                                    '&.Mui-disabled': { opacity: 0.3 },
                                },
                            }}
                        >
                            {
                                famousPlaceInfo?.length > 0 &&
                                <div>
                                    <MuiAccordion expanded={expanded === 'popular places'} disableGutters elevation={0} square sx={{
                                        flexDirection: 'row-reverse',
                                        '& .MuiAccordion-region': {
                                            backgroundColor: '#202124',
                                        },
                                        '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                                            transform: 'rotate(90deg)',
                                        },
                                        '& .MuiAccordionSummary-content': {
                                            marginLeft: '1px',
                                        },
                                    }} onChange={() => {
                                        console.log('popular places');
                                        setExpanded('popular places');
                                    }}>
                                        <MuiAccordionSummary
                                            expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
                                        >
                                            <Typography>Popular Places</Typography>
                                        </MuiAccordionSummary>
                                        <MuiAccordionDetails>
                                            {
                                                famousPlaceInfo.map((item_, index_) => {
                                                    return <div key={index_} style={{
                                                        display: 'flex',
                                                        position: 'relative',
                                                    }}>
                                                        <Tab
                                                            onClick={() => handlewalletNft(item_.token_id, item_.serialNumber)}
                                                            icon={<img alt="land" className="land-image"
                                                                src={item_.token_id === env.DEGENLAND_NFT_ID ? "imgs/front/nfts/degenland.png" :
                                                                    item_.token_id === env.TYCOON_NFT_ID ? "imgs/front/nfts/tycoon.png" :
                                                                        item_.token_id === env.MOGUL_NFT_ID ? "imgs/front/nfts/mogul.png" : "imgs/front/nfts/investor.png"} />}
                                                            label={
                                                                item_.token_id === env.DEGENLAND_NFT_ID ? `Degen - ${item_.serialNumber}` :
                                                                    item_.token_id === env.TYCOON_NFT_ID ? `Tycoon - ${item_.serialNumber}` :
                                                                        item_.token_id === env.MOGUL_NFT_ID ? `Mogul - ${item_.serialNumber}` : `Investor - ${item_.serialNumber}`
                                                            }
                                                        />
                                                        <div style={{
                                                            display: 'flex',
                                                            position: 'absolute',
                                                            left: '93px',
                                                            bottom: '10px',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            width: '90px',
                                                            marginTop: '5px'
                                                        }}
                                                            onClick={() => handlewalletNft(item_.token_id, item_.serialNumber)}
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                color: '#ffe67f',
                                                                flexDirection: 'row',
                                                                cursor: 'pointer',
                                                            }}>
                                                                <ApartmentIcon fontSize="small" />
                                                                <p style={{
                                                                    fontSize: '16px',
                                                                    fontWeight: '700',
                                                                    margin: 0,
                                                                    padding: 0
                                                                }}>
                                                                    {item_.buildingCount}
                                                                </p>
                                                            </div>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                color: '#ffe67f',
                                                                flexDirection: 'row',
                                                                cursor: 'pointer',
                                                            }}>
                                                                <PeopleIcon fontSize="small" />
                                                                <p style={{
                                                                    fontSize: '16px',
                                                                    fontWeight: '700',
                                                                    margin: 0,
                                                                    padding: 0
                                                                }}>
                                                                    {item_.currentVisitor}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                })
                                            }
                                        </MuiAccordionDetails>
                                    </MuiAccordion>
                                </div>
                            }
                            {
                                walletNftInfo?.length > 0 &&
                                <div>
                                    <MuiAccordion expanded={expanded === 'my places'} disableGutters elevation={0} square sx={{
                                        flexDirection: 'row-reverse',
                                        '& .MuiAccordion-region': {
                                            backgroundColor: '#202124',
                                        },
                                        '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                                            transform: 'rotate(90deg)',
                                        },
                                        '& .MuiAccordionSummary-content': {
                                            marginLeft: '1px',
                                        },
                                    }} onChange={() => {
                                        console.log('my places');
                                        setExpanded('my places');
                                    }}>
                                        <MuiAccordionSummary
                                            expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
                                        >
                                            <Typography>My Places</Typography>
                                        </MuiAccordionSummary>
                                        <MuiAccordionDetails>
                                            {
                                                walletNftInfo?.length > 0 &&
                                                walletNftInfo.map((item_, index_) => {
                                                    return <div key={index_} style={{
                                                        display: 'flex',
                                                        position: 'relative',
                                                    }}>
                                                        <Tab
                                                            onClick={() => handlewalletNft(item_.tokenId, item_.serialNum)}
                                                            icon={<img alt="land" className="land-image"
                                                                src={item_.tokenId === env.DEGENLAND_NFT_ID ? "imgs/front/nfts/degenland.png" :
                                                                    item_.tokenId === env.TYCOON_NFT_ID ? "imgs/front/nfts/tycoon.png" :
                                                                        item_.tokenId === env.MOGUL_NFT_ID ? "imgs/front/nfts/mogul.png" : "imgs/front/nfts/investor.png"} />}
                                                            label={
                                                                item_.tokenId === env.DEGENLAND_NFT_ID ? `Degen - ${item_.serialNum}` :
                                                                    item_.tokenId === env.TYCOON_NFT_ID ? `Tycoon - ${item_.serialNum}` :
                                                                        item_.tokenId === env.MOGUL_NFT_ID ? `Mogul - ${item_.serialNum}` : `Investor - ${item_.serialNum}`
                                                            }
                                                        />
                                                        <div style={{
                                                            display: 'flex',
                                                            position: 'absolute',
                                                            left: '93px',
                                                            bottom: '10px',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            width: '90px',
                                                            marginTop: '5px'
                                                        }}
                                                            onClick={() => handlewalletNft(item_.tokenId, item_.serialNum)}
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                color: '#ffe67f',
                                                                flexDirection: 'row',
                                                                cursor: 'pointer',
                                                            }}>
                                                                <ApartmentIcon fontSize="small" />
                                                                <p style={{
                                                                    fontSize: '16px',
                                                                    fontWeight: '700',
                                                                    margin: 0,
                                                                    padding: 0
                                                                }}>
                                                                    {item_.buildingCount}
                                                                </p>
                                                            </div>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                color: '#ffe67f',
                                                                flexDirection: 'row',
                                                                cursor: 'pointer',
                                                            }}>
                                                                <PeopleIcon fontSize="small" />
                                                                <p style={{
                                                                    fontSize: '16px',
                                                                    fontWeight: '700',
                                                                    margin: 0,
                                                                    padding: 0
                                                                }}>
                                                                    {item_.currentVisitor}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                })
                                            }
                                        </MuiAccordionDetails>
                                    </MuiAccordion>
                                </div>
                            }
                        </Tabs>
                    </div>
                }
                {
                    currentLandInfo != null && (currentMap === SINGLE_MAP || currentMap === EDIT_MAP) &&
                    <div className="single-map-wrapper" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                        <div className="map-info">
                            <div className="map-detail">
                                <div>
                                    <ApartmentIcon />
                                    <p>{currentLandInfo.buildingCount}</p>
                                </div>
                                <div>
                                    <PeopleIcon />
                                    <p>{currentLandInfo.totalCustomer}</p>
                                </div>
                                <div>
                                    <TrendingUpIcon />
                                    <p>{currentLandInfo.landBalance}</p>
                                </div>
                            </div>
                            <p>{
                                currentLandInfo.tokenId === env.DEGENLAND_NFT_ID ? `Degen - ${currentLandInfo.serialNum}` :
                                    currentLandInfo.tokenId === env.TYCOON_NFT_ID ? `Tycoon - ${currentLandInfo.serialNum}` :
                                        currentLandInfo.tokenId === env.MOGUL_NFT_ID ? `Mogul - ${currentLandInfo.serialNum}` : `Investor - ${currentLandInfo.serialNum}`
                            }</p>
                        </div>
                        <img alt="AB" className="land-image"
                            src={currentLandInfo.tokenId === env.DEGENLAND_NFT_ID ? "imgs/front/nfts/degenland.png" :
                                currentLandInfo.tokenId === env.TYCOON_NFT_ID ? "imgs/front/nfts/tycoon.png" :
                                    currentLandInfo.tokenId === env.MOGUL_NFT_ID ? "imgs/front/nfts/mogul.png" : "imgs/front/nfts/investor.png"} />
                    </div>
                }
                {
                    currentMap === SINGLE_MAP &&
                    <div>
                        <IconButton sx={CHAT_HISTORY_BTN_STYLE}
                            onClick={(e) => {
                                onClickAlertBtn(e);
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                        >
                            <HistoryIcon fontSize="medium" />
                        </IconButton>
                        <div className="chat-emoji" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                            <EmojiIcon onEmojiPicked={_handleEmojiPicked} />
                        </div>
                        <div className="chat-wrapper" onKeyDown={onChatkeyPress} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                            <input className="chat-text-input" value={chatStr} onChange={(e) => { setChatStr(e.target.value) }} />
                            <div className="sc-user-input--buttons">
                                <Button variant="text" onClick={onSendClick} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                                    <SendIcon />
                                </Button>
                            </div>
                        </div>
                        <IconButton sx={DANCE_BTN_STYLE}
                            selected={dancingSelected}
                            onClick={() => {
                                if (dancingSelected == false)
                                    props.setDancing(true);
                                else
                                    props.setDancing(false);
                                setDancingSelected(!dancingSelected);
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                        >
                            <DirectionsWalkIcon fontSize="medium" />
                        </IconButton>
                    </div>
                }
                <Menu
                    anchorEl={alertMenuAnchor}
                    id='account-menu'
                    open={alertMenuOpenFlag}
                    onClose={alertMenuClose}
                    onClick={alertMenuClose}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    PaperProps={{
                        elevation: 0,
                        style: {
                            maxHeight: '500px',
                            height: '500px',
                            width: '450px',
                            opacity: '0.8',
                        },
                        sx: {
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                            mt: -2,
                            '&:before': {
                                content: '""',
                                display: 'block',
                                position: 'absolute',
                                top: 50,
                                left: 7,
                                width: 10,
                                height: 10,
                                backgroundColor: 'white',
                                transform: 'translateY(-50%) rotate(45deg)',
                                zIndex: 0
                            }
                        }
                    }}
                    transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                    anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                >
                    {
                        chatHistory?.length > 0 &&
                        chatHistory.map((item, index) => {
                            return <div key={index}>
                                <MenuItem>
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}>
                                        <Avatar
                                            src={item.avatarUrl}
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                outline: '2px solid #8b1832',
                                            }}
                                        />
                                        <p style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: '#8b1832',
                                            margin: '0 0 0 5px',
                                            textTransform: 'none'
                                        }}>
                                            {item.playerId}
                                        </p>
                                    </Box>
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}>
                                        <p style={{
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: '#3c617e',
                                            margin: '0 0 0 10px',
                                            width: '330px',
                                            textTransform: 'none',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                        }}>
                                            {item.chatStr}
                                        </p>
                                    </Box>
                                </MenuItem>
                                {
                                    index < chatHistory.length - 1 &&
                                    <Divider />
                                }
                            </div>
                        })
                    }
                    {
                        chatHistory?.length == 0 &&
                        <div>
                            <MenuItem>
                                <p style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: '#3c617e',
                                    margin: '0 0 0 5px',
                                    textTransform: 'none'
                                }}>
                                    No chat history
                                </p>
                            </MenuItem>
                        </div>
                    }
                </Menu>
                {
                    currentMap === EDIT_MAP &&
                    <div className="edit-map-wrapper" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                        <Box className="draw-map-tool">
                            <Tabs
                                value={drawMapToolValue}
                                onChange={onChangeDrawMapTool}
                                variant="scrollable"
                                scrollButtons="auto"
                                aria-label="scrollable auto tabs example"
                            >
                                <Tab icon={<TerrainIcon />} label="Ground" />
                                <Tab icon={<AddRoadIcon />} label="Road" />
                                <Tab icon={<ApartmentIcon />} label="Building" />
                                <Tab icon={<ForestIcon />} label="Object" />
                            </Tabs>
                            <div className="map-content-wrapper">
                                <Grid container>
                                    {
                                        drawMapToolValue == 0 &&
                                        groundTileInfo.map((item_, index_) => {
                                            return <Grid key={index_} item xs={12} md={6} className="single-map-tile" onClick={() => onClickgroundTile(index_)} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                                                <img alt="" src={env.IMG_URL + item_} />
                                            </Grid>;
                                        })
                                    }
                                    {
                                        drawMapToolValue == 1 &&
                                        roadTileInfo.map((item_, index_) => {
                                            return <Grid key={index_} item xs={12} md={6} className="single-map-tile" onClick={() => onClickroadTile(index_)} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                                                <img alt="" src={env.IMG_URL + item_} />
                                            </Grid>;
                                        })
                                    }
                                    {
                                        drawMapToolValue == 2 &&
                                        buildingInfo.map((item_, index_) => {
                                            return <Grid key={index_} item xs={12} md={6} className="single-map-tile" onClick={() => onClickbuildingTile(item_, index_)} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                                                {
                                                    item_.canBuild == true &&
                                                    <img alt="" src={env.IMG_URL + item_.url} />
                                                }
                                                {
                                                    item_.canBuild == false &&
                                                    <img alt="" src={env.IMG_URL + item_.url} style={{
                                                        position: 'relative',
                                                        overflow: 'auto',
                                                        opacity: '0.5'
                                                    }} />
                                                }
                                                {
                                                    item_.canBuild == false &&
                                                    <LockIcon sx={{
                                                        position: 'absolute',
                                                        width: '64px',
                                                        height: '64px',
                                                    }} />
                                                }
                                                {
                                                    item_.canBuild == false &&
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        width: '100%',
                                                        backgroundColor: '#ffffff80'
                                                    }}>
                                                        <p style={{
                                                            margin: 0,
                                                            color: '#873135',
                                                            fontWeight: '700',
                                                            textAlign: 'center',
                                                            width: '100%',
                                                            padding: '0 5px',
                                                            fontSize: '14px'
                                                        }}>{changeToValue(item_.cost)} PAL</p>
                                                    </div>
                                                }
                                            </Grid>;
                                        })
                                    }
                                    {
                                        drawMapToolValue == 3 &&
                                        objectTileInfo.map((item_, index_) => {
                                            return <Grid key={index_} item xs={12} md={6} className="single-map-tile" onClick={() => onClickobjectTile(index_)} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                                                <img alt="" src={env.IMG_URL + item_} />
                                            </Grid>;
                                        })
                                    }
                                </Grid>
                            </div>
                        </Box>
                    </div>
                }
                {
                    currentMap === HOUSE_MAP &&
                    <div className="edit-map-wrapper" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                        <Box className="draw-map-tool">
                            <Tabs
                                value={0}
                                variant="scrollable"
                                scrollButtons="auto"
                                aria-label="scrollable auto tabs example"
                            >
                                <Tab icon={<WeekendIcon />} label="Furniture" />
                            </Tabs>
                            <div className="map-content-wrapper">
                                <Grid container>
                                    {
                                        houseInfo.map((item_, index_) => {
                                            return <Grid key={index_} item xs={12} md={6} className="single-map-tile" onClick={() => onClickhouseTile(item_, index_)} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                                                {
                                                    item_.canBuild == true &&
                                                    <img alt="" src={env.IMG_URL + item_.url} />
                                                }
                                                {
                                                    item_.canBuild == false &&
                                                    <img alt="" src={env.IMG_URL + item_.url} style={{
                                                        position: 'relative',
                                                        overflow: 'auto',
                                                        opacity: '0.5'
                                                    }} />
                                                }
                                                {
                                                    item_.canBuild == false &&
                                                    <LockIcon sx={{
                                                        position: 'absolute',
                                                        width: '64px',
                                                        height: '64px',
                                                    }} />
                                                }
                                                {
                                                    item_.canBuild == false &&
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        width: '100%',
                                                        backgroundColor: '#ffffff80'
                                                    }}>
                                                        <p style={{
                                                            margin: 0,
                                                            color: '#873135',
                                                            fontWeight: '700',
                                                            textAlign: 'center',
                                                            width: '100%',
                                                            padding: '0 5px',
                                                            fontSize: '14px'
                                                        }}>{changeToValue(item_.cost)} PAL</p>
                                                    </div>
                                                }
                                            </Grid>;
                                        })
                                    }
                                </Grid>
                            </div>
                        </Box>
                    </div>
                }
            </div>
            {
                friendInfo.avatarUrl != '' &&
                <Dialog
                    open={playerInfoDlgOpen}
                    scroll='body'
                    onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
                >
                    <PlayerInfoDlg
                        playerId={friendInfo.playerId}
                        playerLvl={friendInfo.level}
                        lvlProcess={friendInfo.levelProcess}
                        friendFlag={friendInfo.isfriend}
                        isinvited={friendInfo.isinvited}
                        aliveFlag={friendInfo.connectState}
                        avatarUrl={env.SERVER_URL + friendInfo?.avatarUrl}
                        degenlandImgUrl={"imgs/front/nfts/degenland.png"}
                        degenlandNftCount={friendInfo.degenlandCount}
                        tycoonImgUrl={"imgs/front/nfts/tycoon.png"}
                        tycoonNftCount={friendInfo.tycoonCount}
                        mogulImgUrl={"imgs/front/nfts/mogul.png"}
                        mogulNftCount={friendInfo.mogulCount}
                        investorImgUrl={"imgs/front/nfts/investor.png"}
                        investorNftCount={friendInfo.investorCount}
                        onClickSendPVMsgBtn={(val) => {
                            socket.emit("sendPrivateMsg", player.accountId, friendInfo.accountId, friendInfo.playerId, val);
                        }}
                        onClickInviteBtn={() => {
                            props.hideFriendInfoDlg();
                            socket.emit("inviteToFriend", player.accountId, friendInfo.accountId, friendInfo.playerId);
                            setPlayerInfoDlgOpen(false);
                        }}
                        onClickOKBtn={() => {
                            props.hideFriendInfoDlg();
                            setPlayerInfoDlgOpen(false);
                        }}
                        onClickInfoBtn={() => {
                            props.hideFriendInfoDlg();
                            console.log("onClickInfoBtn!")
                        }}
                        onClickCancelBtn={() => {
                            props.hideFriendInfoDlg();
                            setPlayerInfoDlgOpen(false);
                        }}
                    />
                </Dialog>
            }

            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loadingView}
            >
                <CircularProgress color="inherit" />
            </Backdrop>

            <Dialog open={showCounter}>
                <div className="counter-container">
                    <div id="countdown">
                        <ul>
                            <li><span id="days">{days}</span>days</li>
                            <li><span id="hours">{hours}</span>Hours</li>
                            <li><span id="minutes">{minutes}</span>Minutes</li>
                            <li><span id="seconds">{seconds}</span>Seconds</li>
                        </ul>
                    </div>
                    <button className="btn btn-default btn-lg" onClick={() => setShowCounter(false)}>OK</button>
                </div>
            </Dialog>
            {
                placeDetailDlgViewFlag == true &&
                <Dialog
                    open={placeDetailDlgViewFlag}
                    scroll='body'
                    onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
                >
                    <PlaceDetailDlg
                        placeInfo={currentLandInfo}
                        onClickConstructionBtn={() => {
                            setPlaceDetailDlgViewFlag(false);
                            props.handlePlaceDetailDialog(false);
                            props.setSceneName("construction");
                        }}
                        onClickVisitBtn={() => {
                            setPlaceDetailDlgViewFlag(false);
                            props.handlePlaceDetailDialog(false);
                            props.setSceneName("view");
                        }}
                        onClickCancelBtn={() => {
                            props.handlePlaceDetailDialog(false);
                            setPlaceDetailDlgViewFlag(false);
                        }}
                    />
                </Dialog>
            }
            {
                buildingInfoDlgViewFlag == true &&
                <Dialog
                    open={buildingInfoDlgViewFlag}
                    scroll='body'
                    onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
                >
                    <BuildingInfoDlg
                        buildingInfo={enteredBuildingInfo}
                        ownerInfo={ownerInfo}
                        onClickEnterBtn={() => {
                            setBuildingInfoDlgViewFlag(false);
                            socket.emit("buildingEntered", accountIds[0], playerInfoStore.data.address);
                            props.setSceneName("building");
                            props.setEntered(true);
                            props.clearData();
                        }}
                        onClickCancelBtn={() => {
                            props.clearData();
                            setBuildingInfoDlgViewFlag(false);
                        }}
                    />
                </Dialog>
            }
            {
                advertisementDlgViewFlag == true &&
                <Dialog
                    open={advertisementDlgViewFlag}
                    scroll='body'
                    onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
                >
                    <AdvertisementDlg
                        advertisementId={advertisementId}
                        onClickAddBtn={(id, name, billboardInfo, mimetype) => {
                            props.setAds(id, name, billboardInfo, mimetype);
                            setAdvertisementDlgViewFlag(false);
                        }}
                        onClickCancelBtn={() => {
                            setAdvertisementDlgViewFlag(false);
                        }}
                    />
                </Dialog>
            }
            <ToastContainer autoClose={5000} draggableDirection="x" />
        </>
    );
}

const mapDispatchToProps = (dispatch) => ({
    setSceneName: (name) => dispatch(setSceneName(name)),
    setPlayerInfo: (data) => dispatch(setPlayerInfo(data)),
    setPalBalance: (balance) => dispatch(setPalBalance(balance)),
    selectNFT: (name) => dispatch(selectNFT(name)),
    nftListChange: (flag) => dispatch(nftListChange(flag)),
    setWalletNftList: (value) => dispatch(setWalletNftList(value)),
    handlePlaceDetailDialog: (flag) => dispatch(handlePlaceDetailDialog(flag)),
    setTeleportData: (data) => dispatch(setTeleportData(data)),
    clearTeleportData: () => dispatch(clearTeleportData()),
    setChatContent: (content) => dispatch(setChatContent(content)),
    setEmoji: (emoji) => dispatch(setEmoji(emoji)),
    addChatHistory: (content) => dispatch(addChatHistory(content)),
    setGround: (value) => dispatch(setGround(value)),
    setRoad: (value) => dispatch(setRoad(value)),
    setBuilding: (value) => dispatch(setBuilding(value)),
    setObject: (value) => dispatch(setObject(value)),
    setHouse: (value) => dispatch(setHouse(value)),
    setFriend: (accountId1, accountId2) => dispatch(setFriend(accountId1, accountId2)),
    hideFriendInfoDlg: () => dispatch(hideFriendInfoDlg()),
    loadNotification: (accountId) => dispatch(loadNotification(accountId)),
    loadFriendList: (accountId, searchStr, sortType) => dispatch(loadFriendList(accountId, searchStr, sortType)),
    moveToFriend: (info) => dispatch(moveToFriend(info)),
    calculateLevel: (accountId) => dispatch(calculateLevel(accountId)),
    updatePlayerInfo: (address, targetPos) => dispatch(updatePlayerInfo(address, targetPos)),
    selectMusic: (musicName, muteState, volumeValue) => dispatch(selectMusic(musicName, muteState, volumeValue)),
    setMute: (flag) => dispatch(setMute(flag)),
    setVolume: (value) => dispatch(setVolume(value)),
    setMusicChanged: (flag) => dispatch(setMusicChanged(flag)),
    setVolumeChanged: (flag) => dispatch(setVolumeChanged(flag)),
    setEntered: (flag) => dispatch(setEntered(flag)),
    clearData: () => dispatch(clearData()),
    setGoOut: (flag) => dispatch(setGoOut(flag)),
    setDancing: (flag) => dispatch(setDancing(flag)),
    setBuildingState: (a, b, c) => dispatch(setBuildingState(a, b, c)),
    setVisitPlace: (name) => dispatch(setVisitPlace(name)),
    getTicket: (address, pos) => dispatch(getTicket(address, pos)),
    setAds: (id, name, billboardInfo, mimetype) => dispatch(setAds(id, name, billboardInfo, mimetype)),
    setHouseInfo: (data) => dispatch(setHouseInfo(data))
})

export default connect(null, mapDispatchToProps)(Main);

const BUTTON_COLOR = '#1976d2';
const DANCE_BTN_STYLE = {
    position: 'absolute',
    bottom: '33px',
    left: '30px',
    width: '42px',
    height: '42px',
    border: '3px solid',
    borderColor: `${BUTTON_COLOR}`,
    color: `${BUTTON_COLOR}`,
    padding: '0',
    '&:focus': {
        outline: 'none'
    }
};

const CHAT_HISTORY_BTN_STYLE = {
    position: 'absolute',
    bottom: '33px',
    left: '77px',
    width: '42px',
    height: '42px',
    border: '3px solid',
    borderColor: `${BUTTON_COLOR}`,
    color: `${BUTTON_COLOR}`,
    padding: '0',
    '&:focus': {
        outline: 'none'
    }
};