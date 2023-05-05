import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';

import { styled, useTheme } from '@mui/material/styles';

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    Avatar,
    Backdrop,
    Button,
    LinearProgress,
    CircularProgress,
    Box,
    Grid,
    Paper,
    TextField,
    Dialog,
    Typography,
} from '@mui/material';

import {
    PersonOutline,
    Add,
    EventNoteOutlined,
    PriceChangeOutlined,
} from '@mui/icons-material';

import { useHashConnect } from "../../../../assets/api/HashConnectAPIProvider.tsx";
import { getRequest, postRequest } from "../../../../assets/api/apiRequests";
import * as env from "../../../../env";

import NavBar from '../../../../components/NavBar';
import AppBar from '../../../../components/AppBar';

export default function ListNFT() {
    const { token_id, serial_number } = useParams();
    let history = useHistory();

    const { walletData, sendHbarAndNftToTreasury } = useHashConnect();
    const { accountIds } = walletData;

    const [imageloadingState, setImageloadingState] = useState(false);
    const [videoLoadingState, setVideoLoadingState] = useState(false);

    const [auctionDlgViewFlag, setAuctionDlgViewFlag] = useState(false);
    const [loadingView, setLoadingView] = useState(false);
    const [nftInfo, setNftInfo] = useState(null);
    const [nftPrice, setNftPrice] = useState(100000);
    const [startAuctionPrice, setStartAuctionPrice] = useState(100000);
    const [minimumAuctionPrice, setMinimumAuctionPrice] = useState(0);
    const [collectionName, setCollectionName] = useState(null);
    const [nftDetailInfo, setNftDetailInfo] = useState(null);
    const [listState, setListState] = useState(null);
    const [auctionState, setAuctionState] = useState(null);
    const [alertInfo, setAlertInfo] = useState([]);
    const [fallbackFee, setFallbackFee] = useState(0);

    useEffect(() => {
        const getCollectionInfo = async (tokenId_) => {
            setLoadingView(true);
            const _collectionInfo = await getRequest(`${env.MIRROR_NET_URL}/api/v1/tokens/${tokenId_}`);
            if (!_collectionInfo) {
                toast.error("Something wrong with network!");
                setLoadingView(false);
                return;
            }
            setCollectionName(_collectionInfo.name);
            setLoadingView(false);
            return;
        }

        const getNftInfoFromMirrorNet = async (tokenId_, serialNum_) => {
            setLoadingView(true);
            const g_singleNftInfo = await getRequest(`${env.MIRROR_NET_URL}/api/v1/tokens/${tokenId_}/nfts?serialNumber=${serialNum_}`);
            if (g_singleNftInfo && g_singleNftInfo.nfts.length > 0) {
                let g_preMdUrl = base64ToUtf8(g_singleNftInfo.nfts[0].metadata).split("//");

                let _metadataUrl = '';
                let ipfsType = 0;
                if (g_preMdUrl[g_preMdUrl.length - 2].includes('ipfs') == true) {
                    _metadataUrl = env.IPFS_URL + g_preMdUrl[g_preMdUrl.length - 1];
                    ipfsType = 1;
                }
                else if (g_preMdUrl[g_preMdUrl.length - 2].includes('https') == true) {
                    if (g_preMdUrl[g_preMdUrl.length - 1].includes('ipfs.infura.io') == true) {
                        let preMdUrlList = g_preMdUrl[g_preMdUrl.length - 1].split('/');
                        _metadataUrl = env.IPFS_URL + preMdUrlList[preMdUrlList?.length - 1];
                        ipfsType = 2;
                    }
                    else if (g_preMdUrl[g_preMdUrl.length - 1].includes('cloudflare-ipfs.com') == true) { //issue
                        return { result: false };
                        // let preMdUrlList = g_preMdUrl[g_preMdUrl.length - 1].split('/');
                        // _metadataUrl = env.IPFS_URL + preMdUrlList[preMdUrlList?.length - 1];
                        // ipfsType = 3;
                    }
                }
    
                const _metadataInfo = await getRequest(_metadataUrl); // get NFT metadata
                if (_metadataInfo && _metadataInfo.image != undefined && _metadataInfo.image?.type != "string") {
                    let _imageUrlList;
                    if (ipfsType == 1)
                        _imageUrlList = _metadataInfo.image.split('://');
                    else if (ipfsType == 2)
                        _imageUrlList = _metadataInfo.image.split('/');
                    else if (ipfsType == 3)
                        _imageUrlList = _metadataInfo.image.description.split('ipfs/');
    
                    let _imageUrlLen = _imageUrlList?.length;
                    let _imageUrl = "";
                    if (ipfsType == 1) {
                        if (_imageUrlLen == 2)
                            _imageUrl = env.IPFS_URL + _imageUrlList[_imageUrlLen - 1];
                        else if (_imageUrlLen == 3)
                            _imageUrl = env.IPFS_URL + _imageUrlList[_imageUrlLen - 2] + "/" + _imageUrlList[_imageUrlLen - 1];
                    }
                    else if (ipfsType == 2) {
                        _imageUrl = env.IPFS_URL + _imageUrlList[_imageUrlLen - 1];
                    }
                    else if (ipfsType == 3) {
                        _imageUrl = env.IPFS_URL + _imageUrlList[_imageUrlLen - 1];
                    }
    
                    const _metaData = {
                        token_id: tokenId_,
                        serial_number: serialNum_,
                        attributes: _metadataInfo.attributes,
                        creator: _metadataInfo.creator,
                        description: _metadataInfo.description,
                        name: _metadataInfo.name,
                        imageUrl: _imageUrl
                    };
                    setNftInfo(_metaData);
                    setLoadingView(false);
                    return;
                }
                toast.error("Something wrong with server!");
                setLoadingView(false);
                return;
            }
            toast.error("Something wrong with server!");
            return;
        }

        const getDetailInfo = async (tokenId_, serialNum_) => {
            setLoadingView(true);
            const _nftDetailRes = await getRequest(`${env.MIRROR_NET_URL}/api/v1/tokens/${tokenId_}`);
            if (!_nftDetailRes) {
                toast.error("Something wrong with server!");
                setLoadingView(false);
                return;
            }
            let _nftDetailList = [];
            _nftDetailList.push({ name: 'Token ID', value: tokenId_ });
            _nftDetailList.push({ name: 'Serial Number', value: serialNum_ });
            _nftDetailList.push({ name: 'Supply', value: _nftDetailRes.total_supply });
            if (_nftDetailRes.custom_fees?.royalty_fees?.length > 0 && _nftDetailRes.custom_fees.royalty_fees[0].fallback_fee) {
                const g_fallback = _nftDetailRes.custom_fees.royalty_fees[0].fallback_fee.amount / 100000000;
                _nftDetailList.push({ name: 'Fallback Fees', value: g_fallback + " HBAR" });
                setFallbackFee(g_fallback);
            }
            if (_nftDetailRes.custom_fees?.royalty_fees?.length > 0) {
                let totalRoyalties = 0;
                for (let i = 0; i < _nftDetailRes.custom_fees.royalty_fees.length; i++)
                    totalRoyalties += _nftDetailRes.custom_fees.royalty_fees[i].amount.numerator * 100 / _nftDetailRes.custom_fees.royalty_fees[i].amount.denominator;
                _nftDetailList.push({ name: 'Artist Royalties', value: totalRoyalties.toFixed(2) + "%" });
            }
            _nftDetailList.push({ name: 'Transaction Fee', value: '2%' });
            _nftDetailList.push({ name: 'Listing/delisting network fee', value: '$0.05' });
            setNftDetailInfo(_nftDetailList);
            return;
        }

        getCollectionInfo(token_id);
        getNftInfoFromMirrorNet(token_id, serial_number);
        getDetailInfo(token_id, serial_number);
        checkList(token_id, serial_number);
        checkAuctionState(token_id, serial_number);
    }, []);

    const checkList = async (tokenId_, serialNum_) => {
        const _res = await getRequest(env.SERVER_URL + "/api/marketplace/check_nft?token_id=" + tokenId_ + "&serial_number=" + serialNum_);
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
        setLoadingView(false);
        setListState(_res.data);
        return;
    }

    const checkAuctionState = async (tokenId_, serialNum_) => {
        const _res = await getRequest(env.SERVER_URL + "/api/auctions/check_nft?token_id=" + tokenId_ + "&serial_number=" + serialNum_);
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
        setLoadingView(false);
        setAuctionState(_res.data);
        return;
    }

    // convert metadata base64 string to utf8
    const base64ToUtf8 = (base64Str_) => {
        // create a buffer
        const _buff = Buffer.from(base64Str_, 'base64');

        // decode buffer as UTF-8
        const _utf8Str = _buff.toString('utf-8');

        return _utf8Str;
    }

    // click auction this nft button
    const onClickAuction = async () => {
        setLoadingView(true);

        const associateFee = 1;
        const _hbarAmount = associateFee + fallbackFee;
        const _approveResult = await sendHbarAndNftToTreasury(_hbarAmount, token_id, serial_number);

        if (!_approveResult) {
            toast.error("Error! The transaction was rejected, or failed! Please try again!");
            setLoadingView(false);
            return false;
        }

        const _postData = {
            owner_accountid: accountIds[0],
            token_id: token_id,
            serial_number: serial_number,
            hbar_amount: _hbarAmount,
            start_auction_price: startAuctionPrice,
            minimum_auction_price: minimumAuctionPrice,
            name: nftInfo.name,
            creator: nftInfo.creator,
            imageUrl: nftInfo.imageUrl
        };

        const _nftListRes = await postRequest(env.SERVER_URL + "/api/auctions/set_list", _postData);
        if (!_nftListRes) {
            toast.error("Something wrong with server!");
            setLoadingView(false);
            return;
        }
        if (!_nftListRes.result) {
            toast.error(_nftListRes.error);
            setLoadingView(false);
            return;
        }
        checkAuctionState(token_id, serial_number);
        // success
        toast.success(_nftListRes.msg);
        setLoadingView(false);
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <NavBar />
            <div style={{
                display: 'flex',
                flexDirection: 'column',
            }}>
                <AppBar
                    alertInfo={alertInfo}
                />
                {
                    nftInfo &&
                    <Box component="main" sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                        p: 3,
                        backgroundColor: '#ffc0ff',
                        marginLeft: '5rem'
                    }}>
                        <Paper
                            sx={{
                                padding: '10px',
                                maxWidth: 1216,
                                my: 1,
                                mx: 'auto',
                                p: 2,
                                backgroundColor: '#ffc0ff',
                                boxShadow: 'none',
                            }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            padding: '5px',
                                            margin: '5px',
                                            maxWidth: '600px',
                                        }}>
                                        <video style={{
                                            position: 'absolute',
                                            borderRadius: '0.375rem',
                                            maxWidth: '564px',
                                        }} autoPlay loop>
                                            <source src={nftInfo.imageUrl} />
                                        </video>
                                        <img alt='' src={imageloadingState ? nftInfo.imageUrl : process.env.PUBLIC_URL + "/imgs/loading.gif"}
                                            onLoad={() => {
                                                setImageloadingState(true);
                                            }}
                                            style={{
                                                borderRadius: '0.375rem',
                                                maxWidth: '564px',
                                            }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    {/* 1 part */}
                                    <h1 style={{
                                        letterSpacing: '-.025em',
                                        fontWeight: '800',
                                        fontSize: '1.875rem',
                                        lineHeight: '2.25rem',
                                        textTransform: 'none',
                                        margin: '0'
                                    }}>
                                        {nftInfo.name}
                                    </h1>
                                    <p style={{
                                        color: 'blue',
                                        marginTop: '0.25rem',
                                        fontWeight: '500',
                                    }}>
                                        {nftInfo.creator}
                                    </p>
                                    {/* 2 part */}
                                    <div style={{
                                        padding: '0.75rem',
                                        borderRadius: '0.75rem',
                                        backgroundColor: 'darkseagreen',
                                        fontWeight: '600',
                                    }}>
                                        First make sure the HashPack Chrome extension is open and unlocked. To list your NFT input the amount of HBAR you would like to sell it for (mininum 2 HBAR). Click "List this NFT". A transaction will be sent to your HashPack wallet, which needs to be approved.
                                        <div style={{
                                            display: 'flex',
                                            paddingBottom: '0.75rem',
                                            marginTop: '0.75rem'
                                        }}>
                                            {
                                                listState?.status == false && auctionState?.status == false &&
                                                <div style={{
                                                    display: 'flex',
                                                    marginTop: '2.5rem'
                                                }}>
                                                    <div style={{
                                                        position: 'relative',
                                                        borderRadius: '0.375rem',
                                                        marginRight: '0.5rem',
                                                    }}>
                                                        <TextField
                                                            label="price"
                                                            type="text"
                                                            size="small"
                                                            value={nftPrice}
                                                            onChange={(e) => {
                                                                const regex = /^[0-9\b]+$/;
                                                                if (e.target.value == "" || regex.test(e.target.value))
                                                                    setNftPrice(e.target.value)
                                                            }}
                                                        />
                                                    </div>
                                                    <Button onClick={async () => {
                                                        setLoadingView(true);

                                                        const associateFee = 1;
                                                        const _hbarAmount = associateFee + fallbackFee;
                                                        const _approveResult = await sendHbarAndNftToTreasury(_hbarAmount, token_id, serial_number);

                                                        if (!_approveResult) {
                                                            toast.error("Error! The transaction was rejected, or failed! Please try again!");
                                                            setLoadingView(false);
                                                            return false;
                                                        }

                                                        const _postData = {
                                                            owner_accountid: accountIds[0],
                                                            collection_name: collectionName,
                                                            token_id: token_id,
                                                            serial_number: serial_number,
                                                            description: nftInfo.description,
                                                            hbar_amount: _hbarAmount,
                                                            price: nftPrice,
                                                            name: nftInfo.name,
                                                            creator: nftInfo.creator,
                                                            imageUrl: nftInfo.imageUrl
                                                        };

                                                        const _nftListRes = await postRequest(env.SERVER_URL + "/api/marketplace/set_list", _postData);
                                                        if (!_nftListRes) {
                                                            toast.error("Something wrong with server!");
                                                            setLoadingView(false);
                                                            return;
                                                        }
                                                        if (!_nftListRes.result) {
                                                            toast.error(_nftListRes.error);
                                                            setLoadingView(false);
                                                            return;
                                                        }
                                                        checkList(token_id, serial_number);
                                                        // success
                                                        toast.success(_nftListRes.msg);
                                                        setLoadingView(false);
                                                    }}
                                                        variant='outlined'
                                                        sx={{
                                                            padding: '1rem, 0.25rem',
                                                            marginRight: '1rem',
                                                            borderRadius: '21px',
                                                            textTransform: 'none',
                                                            fontSize: 14,
                                                            fontWeight: 700,
                                                            color: 'blueviolet',
                                                            border: '1px solid #e74895',
                                                            '&:hover': {
                                                                backgroundColor: 'blueviolet',
                                                                border: '2px solid blueviolet',
                                                                color: 'white',
                                                                boxShadow: 'none',
                                                            },
                                                            '&:focus': {
                                                                outline: 'none',
                                                                boxShadow: 'none',
                                                            }
                                                        }}>
                                                        List this NFT
                                                    </Button>
                                                    {
                                                        auctionState?.status == false &&
                                                        <Button onClick={async () => {
                                                            setAuctionDlgViewFlag(true);
                                                        }}
                                                            variant='outlined'
                                                            sx={{
                                                                padding: '1rem, 0.25rem',
                                                                marginRight: '1rem',
                                                                borderRadius: '21px',
                                                                textTransform: 'none',
                                                                fontSize: 14,
                                                                fontWeight: 700,
                                                                color: 'blueviolet',
                                                                border: '1px solid #e74895',
                                                                '&:hover': {
                                                                    backgroundColor: 'blueviolet',
                                                                    border: '2px solid blueviolet',
                                                                    color: 'white',
                                                                    boxShadow: 'none',
                                                                },
                                                                '&:focus': {
                                                                    outline: 'none',
                                                                    boxShadow: 'none',
                                                                }
                                                            }}>
                                                            Auction this NFT
                                                        </Button>
                                                    }
                                                </div>
                                            }
                                            {
                                                listState?.status == true &&
                                                <div style={{
                                                    display: 'flex',
                                                    marginTop: '2.5rem'
                                                }}>
                                                    <Button
                                                        sx={{
                                                            display: 'flex',
                                                            height: '42px',
                                                            borderRadius: '21px',
                                                            textTransform: 'none',
                                                            fontSize: 14,
                                                            fontWeight: 700,
                                                            color: 'white',
                                                            padding: '0 25px',
                                                            backgroundColor: '#e74895',
                                                            marginRight: '20px',
                                                            '&:hover': {
                                                                backgroundColor: 'grey',
                                                                boxShadow: 'none',
                                                            },
                                                            '&:focus': {
                                                                outline: 'none',
                                                                boxShadow: 'none',
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            history.push(`/item-details/${listState.id}`);
                                                        }}
                                                    >
                                                        View NFT listing
                                                    </Button>
                                                </div>
                                            }
                                            {
                                                auctionState?.status == true &&
                                                <div style={{
                                                    display: 'flex',
                                                    marginTop: '2.5rem'
                                                }}>
                                                    <Button
                                                        sx={{
                                                            display: 'flex',
                                                            height: '42px',
                                                            borderRadius: '21px',
                                                            textTransform: 'none',
                                                            fontSize: 16,
                                                            fontWeight: 700,
                                                            color: 'white',
                                                            padding: '0 25px',
                                                            backgroundColor: '#e74895',
                                                            marginRight: '20px',
                                                            '&:hover': {
                                                                backgroundColor: 'grey',
                                                                boxShadow: 'none',
                                                            },
                                                            '&:focus': {
                                                                outline: 'none',
                                                                boxShadow: 'none',
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            history.push(`/auction-details/${auctionState.id}`);
                                                        }}
                                                    >
                                                        View NFT auction
                                                    </Button>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                    {/* 3 part */}
                                    <Box sx={{
                                        marginTop: '1rem'
                                    }}>
                                        {/* About collection */}
                                        <Box>
                                            <button style={{
                                                display: 'flex',
                                                height: '46px',
                                                position: 'relative',
                                                textAlign: 'left',
                                                paddingTop: '0.5rem',
                                                paddingBottom: '0.5rem',
                                                borderWidth: '1px',
                                                borderRadius: '0.5rem',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                width: '100%',
                                                padding: '0',
                                                lineHeight: 'inherit',
                                                color: 'inherit',
                                                backgroundColor: 'transparent',
                                                backgroundImage: 'none',
                                                fontFamily: 'inherit',
                                                fontSize: '100%',
                                                margin: '0'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    paddingLeft: '1rem',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}>
                                                    <PersonOutline sx={{
                                                        display: 'block',
                                                        color: 'blue',
                                                        verticalAlign: 'middle',
                                                        width: '1.75rem',
                                                        height: '1.75rem',
                                                        marginRight: '0.5rem'
                                                    }} />
                                                    <span style={{
                                                        fontWeight: '700',
                                                        verticalAlign: 'middle'
                                                    }}>
                                                        About {nftInfo.creator}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginLeft: '1.5rem',
                                                    marginRight: '0.5rem'
                                                }}>
                                                    {/* <Add sx={{
                                                        display: 'block',
                                                        width: '1.75rem',
                                                        height: '1.75rem',
                                                        verticalAlign: 'middle',
                                                        color: 'gray'
                                                    }} /> */}
                                                </span>
                                            </button>
                                            <div style={{
                                                paddingTop: '0.5rem',
                                                paddingBottom: '0.5rem',
                                                paddingLeft: '1.5rem',
                                                paddingRight: '1.5rem',
                                                backgroundColor: 'darksalmon',
                                                borderWidth: '1px',
                                                borderRadius: '0.5rem',
                                                marginTop: '0.5rem',
                                                marginBottom: '0.5rem',
                                                fontWeight: '600',
                                            }}>
                                                {nftInfo.description}
                                            </div>
                                        </Box>
                                        {/* About Attributes */}
                                        {
                                            nftInfo.attributes &&
                                            <Box>
                                                <button style={{
                                                    display: 'flex',
                                                    height: '46px',
                                                    position: 'relative',
                                                    textAlign: 'left',
                                                    paddingTop: '0.5rem',
                                                    paddingBottom: '0.5rem',
                                                    borderWidth: '1px',
                                                    borderRadius: '0.5rem',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                    padding: '0',
                                                    lineHeight: 'inherit',
                                                    color: 'inherit',
                                                    backgroundColor: 'transparent',
                                                    backgroundImage: 'none',
                                                    fontFamily: 'inherit',
                                                    fontSize: '100%',
                                                    margin: '0'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        paddingLeft: '1rem',
                                                        justifyContent: 'center',
                                                        alignItems: 'center'
                                                    }}>
                                                        <EventNoteOutlined sx={{
                                                            display: 'block',
                                                            color: 'blue',
                                                            verticalAlign: 'middle',
                                                            width: '1.75rem',
                                                            height: '1.75rem',
                                                            marginRight: '0.5rem'
                                                        }} />
                                                        <span style={{
                                                            fontWeight: '700',
                                                            verticalAlign: 'middle'
                                                        }}>
                                                            Attributes
                                                        </span>
                                                    </div>
                                                    <span style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginLeft: '1.5rem',
                                                        marginRight: '0.5rem'
                                                    }}>
                                                        {/* <Add sx={{
                                                        display: 'block',
                                                        width: '1.75rem',
                                                        height: '1.75rem',
                                                        verticalAlign: 'middle',
                                                        color: 'gray'
                                                    }} /> */}
                                                    </span>
                                                </button>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                                                    paddingTop: '0.25rem',
                                                    paddingBottom: '0.25rem',
                                                    paddingLeft: '0.5rem',
                                                    paddingRight: '0.5rem',
                                                    backgroundColor: 'darksalmon',
                                                    borderWidth: '1px',
                                                    borderRadius: '0.5rem',
                                                    marginTop: '0.5rem',
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    {
                                                        nftInfo.attributes.map((item, index) => {
                                                            return <div key={index} style={{
                                                                padding: '0.75rem',
                                                                backgroundColor: 'black',
                                                                borderRadius: '0.5rem',
                                                                margin: '0.25rem'
                                                            }}>
                                                                <div style={{
                                                                    lineHeight: '1rem',
                                                                    marginBottom: '0.25rem',
                                                                    color: 'darkgray'
                                                                }}>
                                                                    {item.trait_type}
                                                                </div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    flexWrap: 'wrap',
                                                                    rowGap: '0.25rem',
                                                                    columnGap: '1rem',
                                                                    color: 'whitesmoke'
                                                                }}>
                                                                    {item.value}
                                                                </div>
                                                            </div>
                                                        })
                                                    }
                                                </div>
                                            </Box>
                                        }
                                        {/* About Details */}
                                        <Box>
                                            <button style={{
                                                display: 'flex',
                                                height: '46px',
                                                position: 'relative',
                                                textAlign: 'left',
                                                paddingTop: '0.5rem',
                                                paddingBottom: '0.5rem',
                                                borderWidth: '1px',
                                                borderRadius: '0.5rem',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                width: '100%',
                                                padding: '0',
                                                lineHeight: 'inherit',
                                                color: 'inherit',
                                                backgroundColor: 'transparent',
                                                backgroundImage: 'none',
                                                fontFamily: 'inherit',
                                                fontSize: '100%',
                                                margin: '0'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    paddingLeft: '1rem',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}>
                                                    <EventNoteOutlined sx={{
                                                        display: 'block',
                                                        color: 'blue',
                                                        verticalAlign: 'middle',
                                                        width: '1.75rem',
                                                        height: '1.75rem',
                                                        marginRight: '0.5rem'
                                                    }} />
                                                    <span style={{
                                                        fontWeight: '700',
                                                        verticalAlign: 'middle'
                                                    }}>
                                                        Details
                                                    </span>
                                                </div>
                                                <span style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginLeft: '1.5rem',
                                                    marginRight: '0.5rem'
                                                }}>
                                                    {/* <Add sx={{
                                                        display: 'block',
                                                        width: '1.75rem',
                                                        height: '1.75rem',
                                                        verticalAlign: 'middle',
                                                        color: 'gray'
                                                    }} /> */}
                                                </span>
                                            </button>
                                            <div style={{
                                                paddingTop: '0.5rem',
                                                paddingBottom: '0.5rem',
                                                paddingLeft: '1.5rem',
                                                paddingRight: '1.5rem',
                                                backgroundColor: 'darksalmon',
                                                borderWidth: '1px',
                                                borderRadius: '0.5rem',
                                                marginTop: '0.5rem',
                                                marginBottom: '0.5rem'
                                            }}>
                                                {
                                                    nftDetailInfo &&
                                                    nftDetailInfo.map((item, index) => {
                                                        return <div key={index} style={{
                                                            display: 'flex',
                                                            position: 'relative',
                                                            textAlign: 'left',
                                                            paddingTop: '0.25rem',
                                                            paddingBottom: '0.25rem',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            width: '100%'
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                fontWeight: '600',
                                                                justifyContent: 'center',
                                                                alignItems: 'center'
                                                            }}>
                                                                {item.name}
                                                            </div>
                                                            <span style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                marginLeft: '1.5rem',
                                                                color: 'unset',
                                                                fontWeight: '600',
                                                            }}>
                                                                {item.value}
                                                            </span>
                                                        </div>
                                                    })
                                                }
                                            </div>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>
                }
            </div>
            <Dialog
                open={auctionDlgViewFlag}
                scroll='body'
            >
                <div
                    style={{
                        backgroundColor: '#ffc0ff',
                        width: '480px',
                        padding: '15px',
                        overflow: 'hidden'
                    }}>
                    <div style={{
                        position: 'absolute',
                        width: '100px',
                        height: '100px',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        padding: '7px 0',
                        rotate: '-25deg',
                        top: '-10px',
                        left: '-10px',
                    }}>
                        <img alt="Dutch Auction Logo" src={process.env.PUBLIC_URL + "/imgs/marketplace/dutch-auction4.png"}
                            style={{
                                height: '100%',
                            }}
                        />
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '20px 0 20px 20px',
                        position: 'relative',
                    }}>
                        <img alt="Dutch Auction" src={process.env.PUBLIC_URL + "/imgs/marketplace/dutch-auction1.png"} />
                    </div>
                    <div
                        style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: '#8b1832',
                            position: 'relative'
                        }}
                    >
                        <PriceChangeOutlined style={{
                            color: 'white',
                            backgroundColor: '#8b1832',
                            width: '42px',
                            height: '42px',
                            borderRadius: '21px',
                            padding: '2px',
                            position: 'absolute',
                            top: '-20px',
                            left: 'calc(50% - 21px)'
                        }} />
                    </div>
                    <Typography sx={{
                        fontSize: '18px',
                        margin: '20px 0 10px 0',
                    }}>
                        The price that you set in the field will be the starting price for the auction.<br />
                        Every hour the price will be reduced by 1% until someone purchases the item.<br />
                        You are able to cancel the auction at anytime should you want to.
                    </Typography>
                    <div style={{
                        position: 'relative',
                        borderRadius: '0.375rem',
                        margin: '0 0 15px 0',
                    }}>
                        <TextField
                            label="start price"
                            type="text"
                            size="small"
                            value={startAuctionPrice}
                            onChange={(e) => {
                                const regex = /^[0-9\b]+$/;
                                if (e.target.value == "" || regex.test(e.target.value))
                                    setStartAuctionPrice(e.target.value)
                            }}
                        />
                    </div>
                    <div style={{
                        position: 'relative',
                        borderRadius: '0.375rem',
                        marginRight: '0.5rem',
                    }}>
                        <TextField
                            label="minimum price"
                            type="text"
                            size="small"
                            value={minimumAuctionPrice}
                            onChange={(e) => {
                                const regex = /^[0-9\b]+$/;
                                if (e.target.value == "" || regex.test(e.target.value))
                                    setMinimumAuctionPrice(e.target.value)
                            }}
                        />
                    </div>
                    {/* buttons */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'right',
                        margin: '20px 0',
                        width: '100%',
                        padding: '0 20px'
                    }}>
                        <Button onClick={() => {
                            setAuctionDlgViewFlag(false);
                            //                            onClickAuction();
                        }}
                            sx={{
                                height: '42px',
                                borderRadius: '21px',
                                textTransform: 'none',
                                fontSize: 16,
                                fontWeight: 700,
                                color: 'white',
                                padding: '0 25px',
                                backgroundColor: '#e74895',
                                marginRight: '20px',
                                '&:hover': {
                                    backgroundColor: 'grey',
                                    boxShadow: 'none',
                                },
                                '&:focus': {
                                    outline: 'none',
                                    boxShadow: 'none',
                                }
                            }}>
                            Coming Soon{/*Start Auction*/}
                        </Button>
                        <Button onClick={() => {
                            setAuctionDlgViewFlag(false);
                        }}
                            variant='outlined'
                            sx={{
                                height: '42px',
                                borderRadius: '21px',
                                textTransform: 'none',
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#e74895',
                                padding: '0 25px',
                                border: '3px solid #e74895',
                                '&:hover': {
                                    backgroundColor: 'grey',
                                    border: '3px solid grey',
                                    color: 'white',
                                    boxShadow: 'none',
                                },
                                '&:focus': {
                                    outline: 'none',
                                    boxShadow: 'none',
                                }
                            }}>
                            Cancel
                        </Button>
                    </div>
                </div >
            </Dialog>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loadingView}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <ToastContainer autoClose={5000} draggableDirection="x" />
        </Box>
    );
}
