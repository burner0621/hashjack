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
    Pagination
} from '@mui/material';

import {
    ExpandMore,
} from '@mui/icons-material';

import { useHashConnect } from "../../../assets/api/HashConnectAPIProvider.tsx";
import { getRequest, postRequest } from "../../../assets/api/apiRequests";
import * as env from "../../../env";

import NavBar from '../../../components/NavBar';
import AppBar from '../../../components/AppBar';
import NFTCard from "../../../components/NFTCard";

const pagenationDisplayCount = 24;

export default function Collections() {
    const { walletData } = useHashConnect();
    const { accountIds } = walletData;

    let history = useHistory();
    const [loadingView, setLoadingView] = useState(false);
    const [collectionList, setCollectionList] = useState(null);
    const [collectionPageIndex, setCollectionPageIndex] = useState(1);
    const [currentPageCollectionList, setCurrentPageCollectionList] = useState([]);
    const [alertInfo, setAlertInfo] = useState([]);

    useEffect(() => {
        const getCollectionList = async () => {
            setLoadingView(true);
            const _res = await getRequest(env.SERVER_URL + "/api/marketplace/get_collection_list");
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
            setCollectionList(_res.data);
            setLoadingView(false);
        }
        getCollectionList();
    }, []);

    useEffect(() => {
        if (collectionList)
            resetCollectionListToDisplay(1, collectionList);
    }, [collectionList]);

    const resetCollectionListToDisplay = (pageIndex_, nftList_) => {
        let _startIndex = (pageIndex_ - 1) * pagenationDisplayCount;
        let _endIndex = pageIndex_ * pagenationDisplayCount > nftList_.length ? nftList_.length : pageIndex_ * pagenationDisplayCount;
        setCurrentPageCollectionList(nftList_.slice(_startIndex, _endIndex));
    }

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
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    p: 3,
                    backgroundColor: '#ffc0ff',
                    marginLeft: '5rem'
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <h2 style={{
                            textAlign: 'left',
                            fontSize: '1.875rem',
                            lineHeight: '2.25rem',
                            fontWeight: '900',
                            letterSpacing: '-.025em'
                        }}>
                            Collections
                        </h2>
                        <div style={{
                            borderRadius: '0.5rem',
                            marginTop: '0.75rem'
                        }}>
                            {
                                currentPageCollectionList?.length > 0 &&
                                currentPageCollectionList.map((item, index) => {
                                    return <div key={index}>
                                        <Box
                                            sx={{
                                                padding: '1.25rem 1.5rem 1.25rem 1.5rem',
                                                borderBottom: '1px solid #873135',
                                                '&:hover': {
                                                    cursor: 'pointer',
                                                    opacity: '70%',
                                                },
                                            }}
                                            onClick={async () => {
                                                history.push(`/collection/${item.collectionName}`);
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginLeft: '-1rem',
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginLeft: '1rem',
                                                }}>
                                                    <div style={{
                                                        position: 'relative',
                                                        width: '2.5rem',
                                                        height: '2.5rem',
                                                        flexShrink: 0,
                                                    }}>
                                                        <video style={{
                                                            position: 'absolute',
                                                            borderRadius: '0.375rem',
                                                            width: '2.5rem',
                                                            height: '2.5rem',
                                                        }} autoPlay loop>
                                                            <source src={item.imageUrl} />
                                                        </video>
                                                        <img alt='' src={item.imageUrl}
                                                            style={{
                                                                width: '2.5rem',
                                                                height: '2.5rem',
                                                                borderRadius: '0.375rem',
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
                                                            {item.collectionName}
                                                        </h2>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    margin: '0 0',
                                                    display: 'grid',
                                                    gridAutoFlow: 'row dense',
                                                    gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
                                                    fontSize: '.75rem',
                                                    lineHeight: '1rem',
                                                    textAlign: 'left',
                                                    gap: '1rem',
                                                }}>
                                                    <div style={{
                                                        display: 'block',
                                                        minWidth: '170px',
                                                    }}>
                                                        <p style={{
                                                            margin: 0,
                                                            color: 'rebeccapurple',
                                                            fontWeight: '600',
                                                        }}>
                                                            Floor
                                                        </p>
                                                        <p style={{
                                                            fontWeight: '600',
                                                            fontSize: '.875rem',
                                                            lineHeight: '1.25rem',
                                                            margin: 0,
                                                        }}>
                                                            {item.floorPrice} ℏ
                                                        </p>
                                                    </div>
                                                    <div style={{
                                                        display: 'block',
                                                        minWidth: '170px',
                                                    }}>
                                                        <p style={{
                                                            margin: 0,
                                                            color: 'rebeccapurple',
                                                            fontWeight: '600',
                                                        }}>
                                                            Total Vol
                                                        </p>
                                                        <p style={{
                                                            fontWeight: '600',
                                                            fontSize: '.875rem',
                                                            lineHeight: '1.25rem',
                                                            margin: 0,
                                                        }}>
                                                            {item.totalVolume} ℏ
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Box>
                                    </div>
                                })
                            }
                        </div>
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
                                        page={collectionPageIndex}
                                        onChange={(event, value) => {
                                            resetCollectionListToDisplay(value, collectionList);
                                            setCollectionPageIndex(value);
                                        }}
                                        count={parseInt(collectionList.length / pagenationDisplayCount) + (collectionList.length % pagenationDisplayCount !== 0 ? 1 : 0)}
                                        variant="outlined" />
                                </div>
                            }
                        </Box>
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
