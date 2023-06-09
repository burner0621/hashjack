import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    Backdrop,
    Button,
    CircularProgress,
    Box,
    Grid,
    Paper,
    Dialog
} from '@mui/material';

import {
    PersonOutline,
    Add,
    EventNoteOutlined,
    FavoriteBorderOutlined,
    RemoveRedEyeOutlined,
    SellOutlined,
    Done,
    NotificationsOutlined,
} from '@mui/icons-material';

import { useHashConnect } from "../../../../assets/api/HashConnectAPIProvider.tsx";
import { getRequest, postRequest } from "../../../../assets/api/apiRequests";
import * as env from "../../../../env";

import NavBar from '../../../../components/NavBar';
import AppBar from '../../../../components/AppBar';

export default function ItemDetail() {
    const { id } = useParams();
    let history = useHistory();

    const { walletData, buyNFT, autoNFTAssociate, receiveNft } = useHashConnect();
    const { accountIds } = walletData;

    const [loadingView, setLoadingView] = useState(false);
    const [buySuccessfulViewFlag, setBuySuccessfulViewFlag] = useState(false);
    const [offerDialogViewFlag, setOfferDialogViewFlag] = useState(false);

    const [itemDetailInfo, setItemDetailInfo] = useState(null);
    const [nftInfo, setNftInfo] = useState(null);
    const [nftPrice, setNftPrice] = useState(100000);
    const [nftDetailInfo, setNftDetailInfo] = useState(null);
    const [isFavourites, setIsFavourites] = useState(false);
    const [isWatching, setIsWatching] = useState(false);
    const [favourites, setFavourites] = useState(0);
    const [watching, setWatching] = useState(0);
    const [alertInfo, setAlertInfo] = useState([]);

    useEffect(() => {
        const getNftInfo = async (_id) => {
            setLoadingView(true);
            const _res = await getRequest(env.SERVER_URL + "/api/marketplace/get_item_detail?id=" + _id);
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
            for (let i = 0; i < _res.data.favouritesList.length; i++) {
                if (_res.data.favouritesList[i] == accountIds[0])
                    setIsFavourites(true);
            }
            for (let i = 0; i < _res.data.watchingList.length; i++) {
                if (_res.data.watchingList[i] == accountIds[0])
                    setIsWatching(true);
            }
            setItemDetailInfo(_res.data);
            setFavourites(_res.data.favourites);
            setWatching(_res.data.watching);
        }

        if (accountIds?.length > 0)
            getNftInfo(id);
    }, [accountIds]);

    useEffect(() => {
        const getNftInfoFromMirrorNet = async (tokenId_, serialNum_) => {
            const g_singleNftInfo = await getRequest(`${env.MIRROR_NET_URL}/api/v1/tokens/${tokenId_}/nfts?serialNumber=${serialNum_}`);
            if (g_singleNftInfo && g_singleNftInfo.nfts.length > 0) {
                let g_preMdUrl = base64ToUtf8(g_singleNftInfo.nfts[0].metadata).split("//");

                let _metadataUrl = env.IPFS_URL + g_preMdUrl[g_preMdUrl.length - 1];
                const _metadataInfo = await getRequest(_metadataUrl); // get NFT metadata
                if (_metadataInfo && _metadataInfo.image != undefined) {
                    let _imageUrlList = _metadataInfo.image.split('/');
                    let _imageUrlLen = _imageUrlList?.length;
                    const _imageUrl = env.IPFS_URL + _imageUrlList[_imageUrlLen - 2] + "/" + _imageUrlList[_imageUrlLen - 1];

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
            setLoadingView(false);
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

        if (itemDetailInfo) {
            getNftInfoFromMirrorNet(itemDetailInfo.token_id, itemDetailInfo.serial_number);
            getDetailInfo(itemDetailInfo.token_id, itemDetailInfo.serial_number);
        }
    }, [itemDetailInfo]);

    // convert metadata base64 string to utf8
    const base64ToUtf8 = (base64Str_) => {
        // create a buffer
        const _buff = Buffer.from(base64Str_, 'base64');

        // decode buffer as UTF-8
        const _utf8Str = _buff.toString('utf-8');

        return _utf8Str;
    }

    const associateCheck = async (accountId, tokenId) => {
        try {
            const associateInfo = await getRequest(`${env.MIRROR_NET_URL}/api/v1/accounts/${accountId}/tokens?token.id=${tokenId}`);

            // already associated
            if (associateInfo.tokens?.length > 0)
                return { result: true, associated: true };
            return { result: true, associated: false };
        } catch (error) {
            return { result: false, error: error.message };
        }
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <NavBar />
            <div style={{
                display: 'flex',
                flexDirection: 'column'
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
                                        <img alt='' src={nftInfo.imageUrl} style={{
                                            borderRadius: '0.375rem',
                                            maxWidth: '564px',
                                        }} />
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
                                        display: 'flex',
                                        color: 'black',
                                        rowGap: '0.5rem',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        marginTop: '0.5rem',
                                        marginBottom: '1rem',
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginRight: '1.5rem',
                                        }}>
                                            <p style={{
                                                marginRight: '0.25rem',
                                                margin: 0,
                                                fontWeight: '500',
                                            }}>
                                                Owned by {itemDetailInfo.owner_playerid}
                                            </p>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginRight: '1.5rem',
                                        }}>
                                            {
                                                isFavourites == false &&
                                                <FavoriteBorderOutlined fontSize='large'
                                                    sx={{
                                                        display: 'block',
                                                        verticalAlign: 'middle',
                                                        marginRight: '0.5rem',
                                                        height: '1.5rem',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={async () => {
                                                        if (isFavourites == false) {
                                                            setLoadingView(true);
                                                            const _postData = {
                                                                id: id,
                                                                accountId: accountIds[0]
                                                            };
                                                            const _res = await postRequest(env.SERVER_URL + "/api/marketplace/set_favourites", _postData);
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
                                                            setIsFavourites(true);
                                                            setFavourites(_res.data.favourites);
                                                            setLoadingView(false);
                                                        }
                                                    }}
                                                />
                                            }
                                            {
                                                isFavourites == true &&
                                                <FavoriteBorderOutlined fontSize='large'
                                                    sx={{
                                                        display: 'block',
                                                        verticalAlign: 'middle',
                                                        marginRight: '0.5rem',
                                                        height: '1.5rem',
                                                        color: 'red',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={async () => {
                                                        if (isFavourites == true) {
                                                            setLoadingView(true);
                                                            const _postData = {
                                                                id: id,
                                                                accountId: accountIds[0]
                                                            };
                                                            const _res = await postRequest(env.SERVER_URL + "/api/marketplace/unset_favourites", _postData);
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
                                                            setIsFavourites(false);
                                                            setFavourites(_res.data.favourites);
                                                            setLoadingView(false);
                                                        }
                                                    }}
                                                />
                                            }
                                            <p style={{
                                                margin: '0',
                                                fontWeight: '500',
                                            }}>
                                                {favourites} favourites
                                            </p>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}>
                                            {
                                                isWatching == false &&
                                                <RemoveRedEyeOutlined fontSize='large'
                                                    sx={{
                                                        display: 'block',
                                                        verticalAlign: 'middle',
                                                        marginRight: '0.5rem',
                                                        height: '1.5rem',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={async () => {
                                                        if (isWatching == false) {
                                                            setLoadingView(true);
                                                            const _postData = {
                                                                id: id,
                                                                accountId: accountIds[0]
                                                            };
                                                            const _res = await postRequest(env.SERVER_URL + "/api/marketplace/set_watching", _postData);
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
                                                            setIsWatching(true);
                                                            setWatching(_res.data.watching);
                                                            setLoadingView(false);
                                                        }
                                                    }}
                                                />
                                            }
                                            {
                                                isWatching == true &&
                                                <RemoveRedEyeOutlined fontSize='large'
                                                    sx={{
                                                        display: 'block',
                                                        verticalAlign: 'middle',
                                                        marginRight: '0.5rem',
                                                        height: '1.5rem',
                                                        color: 'red',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={async () => {
                                                        if (isWatching == true) {
                                                            setLoadingView(true);
                                                            const _postData = {
                                                                id: id,
                                                                accountId: accountIds[0]
                                                            };
                                                            const _res = await postRequest(env.SERVER_URL + "/api/marketplace/unset_watching", _postData);
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
                                                            setIsWatching(false);
                                                            setWatching(_res.data.watching);
                                                            setLoadingView(false);
                                                        }
                                                    }}
                                                />
                                            }
                                            <p style={{
                                                margin: '0',
                                                fontWeight: '500',
                                            }}>
                                                {watching} watching
                                            </p>
                                        </div>
                                    </div>
                                    {/* 3 part */}
                                    <div style={{
                                        padding: '0.75rem',
                                        borderRadius: '0.75rem',
                                        backgroundColor: 'darkseagreen',
                                    }}>
                                        Current Price
                                        <div style={{
                                            display: 'flex',
                                        }}>
                                            <SellOutlined sx={{
                                                display: 'block',
                                                verticalAlign: 'middle',
                                                width: '1.75rem',
                                                height: '1.75rem',
                                                color: 'blue',
                                            }} />
                                            <p style={{
                                                margin: 0,
                                                fontSize: '1.25rem',
                                                fontWeight: '600',
                                                lineHeight: '1.75rem',
                                                paddingLeft: '0.5rem',
                                            }}>
                                                {itemDetailInfo.price} ℏ
                                            </p>
                                        </div>
                                        {
                                            accountIds[0] == itemDetailInfo.owner_accountid &&
                                            <div style={{
                                                display: 'flex',
                                                paddingBottom: '0.75rem',
                                                marginTop: '0.75rem',
                                            }}>
                                                <Button onClick={async () => {
                                                    setLoadingView(true);

                                                    // approve allowance nft
                                                    const _allowanceData = {
                                                        account_id: accountIds[0],
                                                        token_id: itemDetailInfo.token_id,
                                                        serial_number: itemDetailInfo.serial_number
                                                    };

                                                    const _allowanceRes = await postRequest(env.SERVER_URL + "/api/marketplace/allowance_nft", _allowanceData);
                                                    if (!_allowanceRes) {
                                                        toast.error("Something wrong with server!");
                                                        setLoadingView(false);
                                                        return;
                                                    }
                                                    if (!_allowanceRes.result) {
                                                        toast.error(_allowanceRes.error);
                                                        setLoadingView(false);
                                                        return;
                                                    }

                                                    // fetch nft
                                                    const _receiveRes = await receiveNft(itemDetailInfo.token_id, itemDetailInfo.serial_number);
                                                    if (!_receiveRes) {
                                                        toast.error("Error! The transaction was rejected, or failed! Please try again!");
                                                        setLoadingView(false);
                                                        return;
                                                    }

                                                    // cancel listing
                                                    const _postData = {
                                                        token_id: itemDetailInfo.token_id,
                                                        serial_number: itemDetailInfo.serial_number
                                                    };

                                                    const _cancelListingRes = await postRequest(env.SERVER_URL + "/api/marketplace/cancel_list", _postData);
                                                    if (!_cancelListingRes) {
                                                        toast.error("Something wrong with server!");
                                                        setLoadingView(false);
                                                        return;
                                                    }
                                                    if (!_cancelListingRes.result) {
                                                        toast.error(_cancelListingRes.error);
                                                        setLoadingView(false);
                                                        return;
                                                    }
                                                    setLoadingView(false);
                                                    history.push('/marketplace/1');
                                                }}
                                                    variant='outlined'
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'cetner',
                                                        justifyContent: 'center',
                                                        flex: '1 1 0%',
                                                        maxWidth: '20rem',
                                                        padding: '2rem, 0.5rem',
                                                        marginRight: '1rem',
                                                        borderRadius: '21px',
                                                        textTransform: 'none',
                                                        fontSize: 16,
                                                        fontWeight: 700,
                                                        color: 'white',
                                                        backgroundColor: 'blueviolet',
                                                        '&:focus': {
                                                            outline: 'none',
                                                            boxShadow: 'none',
                                                        }
                                                    }}>
                                                    Cancel Listing
                                                </Button>
                                            </div>
                                        }
                                        {
                                            accountIds[0] != itemDetailInfo.owner_accountid &&
                                            <div style={{
                                                display: 'flex',
                                                paddingBottom: '0.75rem',
                                                marginTop: '0.75rem',
                                            }}>
                                                <Button onClick={async () => {

                                                }}
                                                    variant='outlined'
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'cetner',
                                                        justifyContent: 'center',
                                                        flex: '1 1 0%',
                                                        maxWidth: '20rem',
                                                        padding: '2rem, 0.5rem',
                                                        marginRight: '1rem',
                                                        borderRadius: '21px',
                                                        textTransform: 'none',
                                                        fontSize: 16,
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
                                                    Associate Token
                                                </Button>
                                                <Button onClick={async () => {
                                                    setLoadingView(true);

                                                    const _allowancePostData = {
                                                        account_id: accountIds[0],
                                                        token_id: itemDetailInfo.token_id,
                                                        serial_number: itemDetailInfo.serial_number
                                                    };

                                                    // allowance NFT
                                                    const _allowanceRes = await postRequest(env.SERVER_URL + "/api/marketplace/allowance_nft", _allowancePostData);
                                                    if (!_allowanceRes) {
                                                        toast.error("Something wrong with server!");
                                                        setLoadingView(false);
                                                        return;
                                                    }
                                                    if (!_allowanceRes.result) {
                                                        toast.error(_allowanceRes.error);
                                                        setLoadingView(false);
                                                        return;
                                                    }

                                                    // associate check
                                                    const getResult = await associateCheck(accountIds[0], itemDetailInfo.token_id);
                                                    if (!getResult.result) {
                                                        toast.error(getResult.error);
                                                        setLoadingView(false);
                                                        return;
                                                    }
                                                    if (getResult.associated == false) {
                                                        const _associateResult = await autoNFTAssociate(itemDetailInfo.token_id);

                                                        if (!_associateResult) {
                                                            setLoadingView(false);
                                                            toast.error("Error! Something wrong with associate! Please try again!");
                                                            return;
                                                        }
                                                    }

                                                    // receive nft and send hbar
                                                    const _res = await buyNFT(itemDetailInfo.owner_accountid, itemDetailInfo.token_id, itemDetailInfo.serial_number, itemDetailInfo.price);
                                                    if (!_res) {
                                                        toast.error("Error! The transaction was rejected, or failed! Please try again!");
                                                        setLoadingView(false);
                                                        return;
                                                    }

                                                    // set allowance buyer
                                                    const _nftInfo = {
                                                        d: btoa(itemDetailInfo.token_id),
                                                        e: btoa(itemDetailInfo.serial_number)
                                                    };

                                                    const _postData = {
                                                        a: _nftInfo,
                                                        b: btoa(accountIds[0]),
                                                        c: btoa(itemDetailInfo.price)
                                                    };
                                                    const _sendNftRes = await postRequest(env.SERVER_URL + "/api/marketplace/send_nft", _postData);
                                                    if (!_sendNftRes) {
                                                        toast.error("Something wrong with server!");
                                                        setLoadingView(false);
                                                        return;
                                                    }
                                                    if (!_sendNftRes.result) {
                                                        toast.error(_sendNftRes.error);
                                                        setLoadingView(false);
                                                        return;
                                                    }

                                                    toast.success('success!');
                                                    setLoadingView(false);
                                                    setBuySuccessfulViewFlag(true);
                                                }}
                                                    variant='outlined'
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'cetner',
                                                        justifyContent: 'center',
                                                        flex: '1 1 0%',
                                                        maxWidth: '20rem',
                                                        padding: '2rem, 0.5rem',
                                                        marginRight: '1rem',
                                                        borderRadius: '21px',
                                                        textTransform: 'none',
                                                        fontSize: 16,
                                                        fontWeight: 700,
                                                        color: 'white',
                                                        backgroundColor: 'blueviolet',
                                                        '&:focus': {
                                                            outline: 'none',
                                                            boxShadow: 'none',
                                                        }
                                                    }}>
                                                    Buy this NFT
                                                </Button>
                                                {/*
                                                    <Button onClick={setOfferDialogViewFlag(true)}
                                                        variant='outlined'
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'cetner',
                                                            justifyContent: 'center',
                                                            flex: '1 1 0%',
                                                            maxWidth: '20rem',
                                                            padding: '2rem, 0.5rem',
                                                            marginRight: '1rem',
                                                            borderRadius: '21px',
                                                            textTransform: 'none',
                                                            fontSize: 16,
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
                                                        Make offer
                                                    </Button>
                                                    */}
                                            </div>
                                        }
                                    </div>
                                    {/* 4 part */}
                                    <div style={{
                                        padding: '0.75rem',
                                        marginTop: '0.5rem',
                                        borderRadius: '0.75rem',
                                        backgroundColor: 'darkseagreen',
                                        fontWeight: '600',
                                    }}>
                                        First make sure the HashPack Chrome extension is open and unlocked. To list your NFT input the amount of HBAR you would like to sell it for (mininum 2 HBAR). Click "List this NFT". A transaction will be sent to your HashPack wallet, which needs to be approved.
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
            {
                nftInfo &&
                <Dialog
                    open={buySuccessfulViewFlag}
                    scroll='body'
                >
                    <div style={{
                        display: 'grid',
                        position: 'relative',
                        boxSizing: 'border-box',
                        gridTemplateColumns: 'minmax(0,100%)',
                        width: '32em',
                        maxWidth: '100%',
                        padding: '0 0 1.25rem',
                        border: 'none',
                        borderRadius: '5px',
                        background: '#ffc0ff',
                        color: '#545454',
                        fontFamily: 'inherit',
                        fontSize: '1rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            position: 'relative',
                            boxSizing: 'content-box',
                            justifyContent: 'center',
                            width: '5em',
                            height: '5em',
                            margin: '2.5em auto 0.6em',
                            color: 'steelblue',
                            border: '0.25em solid steelblue',
                            borderRadius: '50%',
                        }}>
                            <Done sx={{
                                width: '81px',
                                height: '81px',
                            }} />
                        </div>
                        <h2 style={{
                            display: 'block',
                            position: 'relative',
                            color: 'black',
                            padding: '24px 24px 0',
                            fontSize: '20px',
                            fontWeight: '600',
                            maxWidth: '100%',
                            margin: 0,
                            textAlign: 'center',
                            textTransform: 'none',
                            wordWrap: 'break-word'
                        }}>
                            Buying Nft Successful!
                        </h2>
                        <div style={{
                            display: 'block',
                            margin: '1em 1.6em 0.3em',
                            padding: 0,
                            overflow: 'auto',
                            fontSize: '1.125em',
                            fontWeight: 'normal',
                            lineHeight: 'normal',
                            textAlign: 'center',
                            wordWrap: 'break-word',
                            wordBreak: 'break-word',
                        }}>
                            <div style={{
                                display: 'block',
                                width: '100%',
                                boxSizing: 'border-box',
                            }}>
                                <h5 style={{
                                    fontSize: '1.064rem',
                                    color: 'black',
                                    fontWeight: '500',
                                }}>
                                    {nftInfo.name}
                                </h5>
                                <div style={{
                                    display: 'block',
                                    boxSizing: 'border-box',
                                    width: '83%',
                                    margin: 'auto',
                                }}>
                                    <img
                                        style={{
                                            maxHeight: '200px',
                                            width: 'auto',
                                            padding: '1.5rem',
                                            maxWidth: '100%',
                                            height: 'auto',
                                            verticalAlign: 'middle',
                                            boxSizing: 'border-box',
                                        }}
                                        src={nftInfo.imageUrl}
                                    >
                                    </img>
                                </div>
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            boxSizing: 'border-box',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 'auto',
                            margin: '1.25em auto 0',
                            padding: 0,
                        }}>
                            <Button onClick={async () => {
                                history.push('/marketplace/1');
                            }}
                                variant='outlined'
                                sx={{
                                    display: 'flex',
                                    alignItems: 'cetner',
                                    justifyContent: 'center',
                                    flex: '1 1 0%',
                                    maxWidth: '20rem',
                                    padding: '2rem, 0.5rem',
                                    marginRight: '1rem',
                                    borderRadius: '21px',
                                    textTransform: 'none',
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: 'white',
                                    backgroundColor: 'blueviolet',
                                    '&:focus': {
                                        outline: 'none',
                                        boxShadow: 'none',
                                    }
                                }}>
                                OK
                            </Button>
                        </div>
                    </div>
                </Dialog>
            }
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
