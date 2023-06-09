import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';

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
    TextField,
} from '@mui/material';

import {
    TabList,
    TabContext,
    TabPanel
} from '@mui/lab';

import { useHashConnect } from "../../../../assets/api/HashConnectAPIProvider.tsx";
import { getRequest, postRequest } from "../../../../assets/api/apiRequests";
import * as env from "../../../../env";

import NavBar from '../../../../components/NavBar';
import AppBar from '../../../../components/AppBar';
import NFTCard from "../../../../components/NFTCard";

const pagenationDisplayCount = 24;

export default function Collection() {
    const { collection_name } = useParams();
    const { walletData } = useHashConnect();
    const { accountIds } = walletData;

    let history = useHistory();
    const [loadingView, setLoadingView] = useState(false);
    const [collectionInfo, setCollectionInfo] = useState(null);
    const [commonData, setCommonData] = useState(null);
    const [search, setSearch] = useState('');

    const [nftPageIndex, setNftPageIndex] = useState(1);
    const [currentPageNftList, setCurrentPageNftList] = useState([]);
    const [alertInfo, setAlertInfo] = useState([]);

    const [tabValue, setTabValue] = useState('ITEMS');

    useEffect(() => {
        const getCollectionInfo = async () => {
            console.log(collection_name);
            setLoadingView(true);
            const _res = await getRequest(env.SERVER_URL + "/api/marketplace/get_list_by_collection_name?collectionName=" + collection_name);
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
            console.log(_res.data);
            setCollectionInfo(_res.data);
            setCommonData(_res.common_data);
            setLoadingView(false);
        }
        getCollectionInfo();
    }, []);

    useEffect(() => {
        if (collectionInfo)
            resetNftListToDisplay(1, collectionInfo);
    }, [collectionInfo]);

    const resetNftListToDisplay = (pageIndex_, nftList_) => {
        let _startIndex = (pageIndex_ - 1) * pagenationDisplayCount;
        let _endIndex = pageIndex_ * pagenationDisplayCount > nftList_.length ? nftList_.length : pageIndex_ * pagenationDisplayCount;
        setCurrentPageNftList(nftList_.slice(_startIndex, _endIndex));
    }

    const handleTabChange = (event, newValue) => {
        // setCurrentPageNftList([]);
        // setTabValue(newValue);
        // if (newValue == 'Owned')
        //     resetNftListToDisplay(1, unlistedNfts);
        // else if (newValue == 'Listings')
        //     resetNftListToDisplay(1, listedNfts);
        // else if (newValue == 'Collections')
        //     getCollectionListing();
    };

    return (
        <Box sx={{
            display: 'flex',
            height: 'fit-content',
            minHeight: '100vh',
        }}>
            <NavBar />
            <Box style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
            }}>
                <AppBar
                    alertInfo={alertInfo}
                />
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    p: 3,
                    backgroundColor: '#ffc0ff',
                    marginLeft: '5rem'
                }}>
                    {
                        commonData != null &&
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            padding: '4rem 0 6rem 2.5rem',
                        }}>
                            <Box sx={{
                                width: '200px',
                                borderRadius: '9999px',
                                overflow: 'auto',
                            }}>
                                <Avatar alt='pengupals' src={commonData.collectionImageUrl}
                                    sx={{
                                        maxWidth: '100%',
                                        width: '200px',
                                        height: '200px',
                                        borderRadius: '9999px',
                                        overflow: 'auto',
                                        border: '4px solid white'
                                    }}
                                />
                            </Box>
                            {/* common info */}
                            <Box sx={{
                                maxWidth: '1000px',
                                margin: '0 0 0 3.5rem',
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    rowGap: '0.75rem',
                                    flexWrap: 'wrap',
                                    color: '#873135',
                                }}>
                                    <span style={{
                                        fontWeight: '800',
                                        fontSize: '1.875em',
                                        lineHeight: '2.25rem',
                                        textAlign: 'center',
                                    }}>{commonData.collectionName}</span>
                                </Box>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gridRowStart: 2,
                                    }}>
                                        <Box sx={{
                                            gap: '0.75rem',
                                            gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
                                            width: '100%',
                                            display: 'grid',
                                        }}>
                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.5rem',
                                                backgroundColor: 'black',
                                                color: 'white',
                                                borderRadius: '0.375rem',
                                            }}>
                                                <span style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    lineHeight: '1rem',
                                                }}>
                                                    FLOOR
                                                </span>
                                                <span style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    fontWeight: '600',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {commonData.floorPrice} ℏ
                                                </span>
                                            </Box>
                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.5rem',
                                                backgroundColor: 'black',
                                                color: 'white',
                                                borderRadius: '0.375rem',
                                            }}>
                                                <span style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    lineHeight: '1rem',
                                                }}>
                                                    LISTED
                                                </span>
                                                <span style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    fontWeight: '600',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {commonData.listedCount}
                                                </span>
                                            </Box>
                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.5rem',
                                                backgroundColor: 'black',
                                                color: 'white',
                                                borderRadius: '0.375rem',
                                            }}>
                                                <span style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    lineHeight: '1rem',
                                                }}>
                                                    TOTAL VOL
                                                </span>
                                                <span style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    fontWeight: '600',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {commonData.totalVolume} ℏ
                                                </span>
                                            </Box>
                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.5rem',
                                                backgroundColor: 'black',
                                                color: 'white',
                                                borderRadius: '0.375rem',
                                            }}>
                                                <span style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    lineHeight: '1rem',
                                                }}>
                                                    AVG.SALE
                                                </span>
                                                <span style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    fontWeight: '600',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {commonData.avgSalePrice} ℏ
                                                </span>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box sx={{
                                        margin: '1.25rem 0 0 2.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gridRowStart: '2'
                                    }}>
                                        <Box sx={{
                                            paddingLeft: '1.5rem',
                                            borderLeft: '1px solid #8b1832',
                                        }}>
                                            <Box sx={{
                                                display: 'block',
                                                textAlign: 'left',
                                                maxWidth: '48rem',
                                                marginTop: '-0.5rem',
                                                fontSize: '18px',
                                                color: '#873135',
                                            }}>
                                                <span>{commonData.description}</span>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    }
                    <Box sx={{ width: '100%', typography: 'body1' }}>
                        <TabContext value={tabValue}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleTabChange} aria-label="lab API tabs example">
                                    <Tab label="ITEMS" value="ITEMS" />
                                </TabList>
                            </Box>
                            <TabPanel className='flex flex-column' value="ITEMS">
                                <div className='hidden flex flex-col w-full md:flex-row items-center mt-2 px-5'>
                                    <div className='relative flex-1 pr-3 md:flex'>
                                        <TextField
                                            label="search"
                                            type="text"
                                            size="small"
                                            value={search}
                                        />
                                    </div>
                                </div>
                                <Box>
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
                                                        history.push(`/item-details/${item._id}`);
                                                    }}
                                                />
                                            </Box>
                                        })
                                    }
                                </Box>
                            </TabPanel>
                        </TabContext>
                    </Box>
                    <Box>
                        {
                            collectionInfo?.length > 0 &&
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
                                        resetNftListToDisplay(value, collectionInfo);
                                        setNftPageIndex(value);
                                    }}
                                    count={parseInt(collectionInfo.length / pagenationDisplayCount) + (collectionInfo.length % pagenationDisplayCount !== 0 ? 1 : 0)}
                                    variant="outlined" />
                            </div>
                        }
                    </Box>
                </Box>
            </Box>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loadingView}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
}
