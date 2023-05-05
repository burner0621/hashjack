import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";

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
    Tab,
    Pagination,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';

import {
    TabList,
    TabContext,
    TabPanel
} from '@mui/lab';

import { useHashConnect } from "../../../assets/api/HashConnectAPIProvider.tsx";
import { getRequest, postRequest } from "../../../assets/api/apiRequests";
import * as env from "../../../env";

import NavBar from '../../../components/NavBar';
import AppBar from '../../../components/AppBar';
import NFTCard from "../../../components/NFTCard";

const pagenationDisplayCount = 24;

export default function Profile() {
    const { walletData } = useHashConnect();
    const { accountIds } = walletData;

    let history = useHistory();
    const [loadingView, setLoadingView] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [unlistedNfts, setUnlistedNfts] = useState(null);
    const [listedNfts, setListedNfts] = useState(null);
    const [allNfts, setAllNfts] = useState(null);
    const [nextLinkOfGetWalletNft, setNextLinkOfGetWalletNft] = useState(null);
    const [collectionList, setCollectionList] = useState(null);
    const [nftCount, setNftCount] = useState(0);

    const [nftPageIndex, setNftPageIndex] = useState(1);
    const [currentPageNftList, setCurrentPageNftList] = useState([]);
    const [alertInfo, setAlertInfo] = useState([]);

    const [alignment, setAlignment] = useState('Unlisted NFTs');
    const [buttonClick, setButtonClick] = useState(true);

    const [tabValue, setTabValue] = useState('Owned');

    const handleChange = (event, newAlignment) => {
        setAlignment(newAlignment);
        if (newAlignment == 'Unlisted NFTs') {
            setButtonClick(true);
            resetNftListToDisplay(1, unlistedNfts);
        }
        else if (newAlignment == 'All NFTs') {
            setButtonClick(false);
            resetNftListToDisplay(1, allNfts);
        }
    };

    useEffect(() => {
        if (accountIds?.length > 0) {
//            accountIds[0] = "0.0.638341";
            getProfileData(accountIds[0]);
            getNftCount();
            getNftData(1);
        }
    }, [accountIds]);

    useEffect(() => {
        if (unlistedNfts)
            resetNftListToDisplay(1, unlistedNfts);
    }, [unlistedNfts]);

    const resetNftListToDisplay = (pageIndex_, nftList_) => {
        let _startIndex = (pageIndex_ - 1) * pagenationDisplayCount;
        let _endIndex = pageIndex_ * pagenationDisplayCount > nftList_.length ? nftList_.length : pageIndex_ * pagenationDisplayCount;
        setCurrentPageNftList(nftList_.slice(_startIndex, _endIndex));
    }

    // load profile data
    const getProfileData = async (accountId) => {
        setLoadingView(true);
        const _res = await getRequest(env.SERVER_URL + "/api/account/get_player?accountId=" + accountId);
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
        setProfileData(_res.data);
    }

    const getNftCount = async () => {
        setLoadingView(true);
        let nftList = [];
        let pageCount = 0;

        // get listed nft list
        const _listedListRes = await getRequest(env.SERVER_URL + "/api/marketplace/get_list_by_accountid?accountId=" + accountIds[0]);
        if (!_listedListRes) {
            toast.error("Something wrong with server!");
            setLoadingView(false);
            return;
        }
        if (!_listedListRes.result) {
            toast.error(_listedListRes.error);
            setLoadingView(false);
            return;
        }

        // get auction nft list
        const _auctionRes = await getRequest(env.SERVER_URL + "/api/auctions/get_list_by_accountid?accountId=" + accountIds[0]);
        if (!_auctionRes) {
            toast.error("Something wrong with server!");
            setLoadingView(false);
            return;
        }
        if (!_auctionRes.result) {
            toast.error(_auctionRes.error);
            setLoadingView(false);
            return;
        }
        const _listedNftData = _listedListRes.data.concat(_auctionRes.data);
        pageCount += Math.ceil(_listedNftData.length / pagenationDisplayCount);
        for (let i = 0; i < _listedNftData.length; i++) {
            const data = {
                token_id: _listedNftData[i].token_id,
                serial_number: _listedNftData[i].serial_number,
                name: _listedNftData[i].name,
                creator: _listedNftData[i].creator,
                imageUrl: _listedNftData[i].imageUrl,
            }
            nftList.push(data);
        }
        setListedNfts(nftList);

        // get unlisted nft list
        let _nextLink = null;

        let _WNinfo = await getRequest(env.MIRROR_NET_URL + "/api/v1/accounts/" + accountIds[0] + "/nfts");
        if (!_WNinfo) {
            toast.error("Something wrong with network!");
            setLoadingView(false);
            return;
        }

        if (_WNinfo.nfts && _WNinfo.nfts.length > 0)
            _nextLink = _WNinfo.links.next;

        while (1) {
            if (!_nextLink || _nextLink === null) break;
            pageCount++;

            _WNinfo = await getRequest(env.MIRROR_NET_URL + _nextLink);
            _nextLink = null;
            if (_WNinfo.nfts && _WNinfo.nfts.length > 0)
                _nextLink = _WNinfo.links.next;
        }
        setNftCount(pageCount);
    }

    const getNftData = async (pageNumber_) => {
        await getWalletNftData(pageNumber_);
    }

    const getWalletNftData = async (pageNumber_) => {
        setLoadingView(true);

        let _nextLink;
        let _newWalletNftInfo = [];
        let count = 1;

        let _WNinfo = await getRequest(env.MIRROR_NET_URL + "/api/v1/accounts/" + accountIds[0] + "/nfts");
        if (!_WNinfo) {
            toast.error("Something wrong with network!");
            setLoadingView(false);
            return;
        }

        if (_WNinfo.nfts && _WNinfo.nfts.length > 0)
            _nextLink = _WNinfo.links.next;

        while (1) {
            if (count == pageNumber_) {
                let _tempNftInfo = _WNinfo.nfts;

                for (let i = 0; i < _tempNftInfo.length; i++) {
                    let _nftInfoResponse = await getNftInfoFromMirrorNet(_tempNftInfo[i].token_id, _tempNftInfo[i].serial_number);

                    if (_nftInfoResponse.result) {
                        _newWalletNftInfo.push({
                            token_id: _tempNftInfo[i].token_id,
                            serial_number: _tempNftInfo[i].serial_number,
                            imageUrl: _nftInfoResponse.metaData.imageUrl,
                            name: _nftInfoResponse.metaData.name,
                            creator: _nftInfoResponse.metaData.creator,
                        })
                    }
                }
                break;
            }
            if (!_nextLink || _nextLink === null) break;

            _WNinfo = await getRequest(env.MIRROR_NET_URL + _nextLink);
            _nextLink = null;
            count++;
            if (_WNinfo.nfts && _WNinfo.nfts.length > 0)
                _nextLink = _WNinfo.links.next;
        }

        setUnlistedNfts(_newWalletNftInfo);
        setAllNfts(_newWalletNftInfo.concat(listedNfts));
        setLoadingView(false);
    }

    const getNftInfoFromMirrorNet = async (tokenId_, serialNum_) => {
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
                    creator: _metadataInfo.creator,
                    name: _metadataInfo.name,
                    imageUrl: _imageUrl
                };
                return { result: true, metaData: _metaData };
            }
            return { result: false };
        }
        return { result: false };
    }

    const getCollectionListing = async () => {
        let _collectionList = [];
        for (let i = 0; i < allNfts.length; i++) {
            let _creator = allNfts[i].creator;
            let _imageUrl = allNfts[i].imageUrl;
            let _flag = 0;
            for (let j = 0; j < _collectionList.length; j++) {
                if (_creator == _collectionList[j].creator)
                    _flag = 1;
            }
            if (_flag == 0) {
                _collectionList.push({
                    imageUrl: _imageUrl,
                    creator: _creator
                });
            }
        }
        setCollectionList(_collectionList);
    }

    // convert metadata base64 string to utf8
    const base64ToUtf8 = (base64Str_) => {
        // create a buffer
        const _buff = Buffer.from(base64Str_, 'base64');

        // decode buffer as UTF-8
        const _utf8Str = _buff.toString('utf-8');

        return _utf8Str;
    }

    const handleTabChange = (event, newValue) => {
        setCurrentPageNftList([]);
        setTabValue(newValue);
        if (newValue == 'Owned')
            resetNftListToDisplay(1, unlistedNfts);
        else if (newValue == 'Listings')
            resetNftListToDisplay(1, listedNfts);
        else if (newValue == 'Collections')
            getCollectionListing();
    };

    return (
        <Box sx={{
            display: 'flex',
            height: 'fit-content',
            minHeight: '100vh',
        }}>
            <NavBar />
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
            }}>
                <AppBar
                    alertInfo={alertInfo}
                />
                <Box component="main" sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    p: 3,
                    backgroundColor: '#ffc0ff',
                    marginLeft: '5rem'
                }}>
                    {/* account info */}
                    {
                        profileData &&
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '100px',
                            marginBottom: '10px',
                            position: 'relative'
                        }}>
                            <Avatar alt={profileData.accountId} src={env.SERVER_URL + profileData.avatarUrl}
                                sx={{
                                    width: 128,
                                    height: 128,
                                    fontSize: '64px',
                                    backgroundColor: '#e0e0e0',
                                    border: '2px solid white'
                                }}
                            />
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                marginLeft: '20px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center'
                                }}>
                                    <p style={{
                                        width: 180,
                                        margin: '0',
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        color: '#873135',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {profileData.playerId}
                                    </p>
                                    <Button
                                        sx={{
                                            height: '25px',
                                            borderRadius: '21px',
                                            textTransform: 'none',
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: 'white',
                                            padding: '0 25px',
                                            backgroundColor: '#e74895',
                                            marginRight: '5px',
                                            '&:hover': {
                                                backgroundColor: 'grey',
                                                boxShadow: 'none',
                                            },
                                            '&:focus': {
                                                outline: 'none',
                                                boxShadow: 'none',
                                            }
                                        }}>
                                        Edit
                                    </Button>
                                </div>
                                <LinearProgress variant='determinate' value={(profileData.currentLevelScore / profileData.targetLevelScore) * 100} />
                                <p style={{
                                    margin: '0',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#1976d2',
                                    marginBottom: '5px'
                                }}>
                                    Level : {profileData.level}
                                </p>
                            </div>
                        </div>
                    }
                    <Box sx={{ width: '100%', typography: 'body1' }}>
                        <TabContext value={tabValue}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleTabChange} aria-label="lab API tabs example">
                                    <Tab label="Owned" value="Owned" />
                                    <Tab label="Listings" value="Listings" />
                                    <Tab label="Collections" value="Collections" />
                                </TabList>
                            </Box>
                            <TabPanel className='flex flex-column' value="Owned">
                                <div className="flex justify-end space-x-2 lg:space-x-3">
                                    <ToggleButtonGroup
                                        color="primary"
                                        value={alignment}
                                        exclusive
                                        onChange={handleChange}
                                        aria-label="Platform"
                                    >
                                        <ToggleButton value="Unlisted NFTs" sx={{
                                            '&:focus': {
                                                outline: 'none',
                                            }
                                        }}>Unlisted NFTs</ToggleButton>
                                        <ToggleButton value="All NFTs" sx={{
                                            '&:focus': {
                                                outline: 'none',
                                            }
                                        }}>All NFTs</ToggleButton>
                                    </ToggleButtonGroup>
                                </div>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}>
                                    <Box>
                                        {
                                            currentPageNftList?.length == 0 &&
                                            <p style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: '#8b1832',
                                                margin: '5px 25px 25px 25px',
                                                textTransform: 'none',
                                                textAlign: 'center',
                                            }}>
                                                No NFT
                                            </p>
                                        }
                                        {
                                            currentPageNftList?.length > 0 &&
                                            currentPageNftList.map((item, index) => {
                                                return <Box key={index}
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        float: 'left',
                                                        width: '250px',
                                                        padding: '5px',
                                                        margin: '5px'
                                                    }}>
                                                    <NFTCard nftInfo={item}
                                                        onClickNFTCard={() => {
                                                            history.push(`/profile/${item.token_id}/${item.serial_number}`);
                                                        }}
                                                    />
                                                </Box>
                                            })
                                        }
                                    </Box>
                                    <Box>
                                        {
                                            nftCount > 0 &&
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'right',
                                                paddingTop: '10px',
                                                paddingRight: '10px',
                                            }}>
                                                <Pagination
                                                    sx={{
                                                        '& li': {
                                                            padding: '0',
                                                            '& button': {
                                                                '&:focus': {
                                                                    outline: 'none',
                                                                },
                                                            },
                                                        },
                                                    }}
                                                    page={nftPageIndex}
                                                    onChange={async (event, value) => {
                                                        setCurrentPageNftList(null);
                                                        setNftPageIndex(value);
                                                        await getNftData(value);
                                                    }}
                                                    count={nftCount}
                                                    variant="outlined" />
                                            </div>
                                        }
                                    </Box>
                                </Box>
                            </TabPanel>
                            <TabPanel value="Listings">
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <Box>
                                        {
                                            currentPageNftList?.length == 0 &&
                                            <p style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: '#8b1832',
                                                margin: '5px 25px 25px 25px',
                                                textTransform: 'none',
                                                textAlign: 'center',
                                            }}>
                                                No NFT
                                            </p>
                                        }
                                        {
                                            currentPageNftList?.length > 0 &&
                                            currentPageNftList.map((item, index) => {
                                                return <Box key={index}
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        float: 'left',
                                                        width: '250px',
                                                        padding: '5px',
                                                        margin: '5px'
                                                    }}>
                                                    <NFTCard nftInfo={item}
                                                        onClickNFTCard={() => {
                                                            history.push(`/profile/${item.token_id}/${item.serial_number}`);
                                                        }}
                                                    />
                                                </Box>
                                            })
                                        }
                                    </Box>
                                    <Box>
                                        {
                                            listedNfts?.length > 0 &&
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'right',
                                                paddingTop: '10px',
                                                paddingRight: '10px',
                                            }}>
                                                <Pagination
                                                    sx={{
                                                        '& li': {
                                                            padding: '0',
                                                            '& button': {
                                                                '&:focus': {
                                                                    outline: 'none',
                                                                },
                                                            },
                                                        },
                                                    }}
                                                    page={nftPageIndex}
                                                    onChange={(event, value) => {
                                                        resetNftListToDisplay(value, listedNfts);
                                                        setNftPageIndex(value);
                                                    }}
                                                    count={parseInt(listedNfts.length / pagenationDisplayCount) + (listedNfts.length % pagenationDisplayCount !== 0 ? 1 : 0)}
                                                    variant="outlined" />
                                            </div>
                                        }
                                    </Box>
                                </Box>
                            </TabPanel>
                            <TabPanel value="Collections">
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '1.25rem 1.5rem 2.5rem 1.5rem',
                                }}>
                                    <Box>
                                        {
                                            collectionList?.length == 0 &&
                                            <p style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: '#8b1832',
                                                margin: '5px 25px 25px 25px',
                                                textTransform: 'none',
                                                textAlign: 'center',
                                            }}>
                                                No Collection
                                            </p>
                                        }
                                        {
                                            collectionList?.length > 0 &&
                                            collectionList.map((item, index) => {
                                                return <Box key={index}>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            position: 'relative',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            width: '100%',
                                                            textAlign: 'left',
                                                            padding: '0.5rem 0',
                                                            borderBottom: '1px solid #8b1832',
                                                            margin: '0.5px 0',
                                                            backgroundColor: '#ffc0ff',
                                                        }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                        }}>
                                                            <div style={{
                                                                position: 'relative',
                                                            }}>
                                                                <video style={{
                                                                    position: 'absolute',
                                                                    display: 'block',
                                                                    verticalAlign: 'middle',
                                                                    borderRadius: '0.375rem',
                                                                    maxWidth: '100%',
                                                                    width: '2.5rem',
                                                                    height: '2.5rem',
                                                                }} autoPlay loop>
                                                                    <source src={item.imageUrl} />
                                                                </video>
                                                                <img alt='' src={item.imageUrl}
                                                                    style={{
                                                                        display: 'block',
                                                                        verticalAlign: 'middle',
                                                                        width: '2.5rem',
                                                                        height: '2.5rem',
                                                                        borderRadius: '0.375rem',
                                                                        maxWidth: '100%',
                                                                    }}
                                                                />
                                                            </div>
                                                            <div style={{
                                                                fontSize: '1.125rem',
                                                                fontWeight: '500',
                                                                lineHeight: '1.5rem',
                                                                marginLeft: '10px',
                                                                marginRight: '10px',
                                                            }}>
                                                                <h2 style={{
                                                                    fontSize: '1.25rem',
                                                                    lineHeight: '1.75rem',
                                                                    fontWeight: 'inherit',
                                                                    margin: 0,
                                                                }}>
                                                                    {item.creator}
                                                                </h2>
                                                            </div>
                                                        </div>
                                                    </Box>
                                                </Box>
                                            })
                                        }
                                    </Box>
                                    <Box>
                                        {
                                            collectionList?.length > 0 &&
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'right',
                                                paddingTop: '10px',
                                                paddingRight: '10px',
                                            }}>
                                                <Pagination
                                                    sx={{
                                                        '& li': {
                                                            padding: '0',
                                                            '& button': {
                                                                '&:focus': {
                                                                    outline: 'none',
                                                                },
                                                            },
                                                        },
                                                    }}
                                                    page={nftPageIndex}
                                                    onChange={(event, value) => {
                                                        resetNftListToDisplay(value, collectionList);
                                                        setNftPageIndex(value);
                                                    }}
                                                    count={parseInt(collectionList.length / pagenationDisplayCount) + (collectionList.length % pagenationDisplayCount !== 0 ? 1 : 0)}
                                                    variant="outlined" />
                                            </div>
                                        }
                                    </Box>
                                </Box>
                            </TabPanel>
                        </TabContext>
                    </Box>
                </Box>
            </div>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loadingView}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
}
