import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";

import { styled, useTheme } from '@mui/material/styles';

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    Backdrop,
    CircularProgress,
    Box,
    Pagination,
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

export default function Auctions() {
    const { walletData } = useHashConnect();
    const { accountIds } = walletData;

    let history = useHistory();
    const [loadingView, setLoadingView] = useState(false);
    const [nftList, setNftList] = useState(null);
    const [nftPageIndex, setNftPageIndex] = useState(1);
    const [currentPageNftList, setCurrentPageNftList] = useState([]);
    const [alertInfo, setAlertInfo] = useState([]);

    useEffect(() => {
        const getNftList = async () => {
            setLoadingView(true);
            const _res = await getRequest(env.SERVER_URL + "/api/auctions/get_list");
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
            setNftList(_res.data);
            setLoadingView(false);
        }
        getNftList();
    }, []);

    useEffect(() => {
        if (nftList)
            resetNftListToDisplay(1, nftList);
    }, [nftList]);

    const resetNftListToDisplay = (pageIndex_, nftList_) => {
        let _startIndex = (pageIndex_ - 1) * pagenationDisplayCount;
        let _endIndex = pageIndex_ * pagenationDisplayCount > nftList_.length ? nftList_.length : pageIndex_ * pagenationDisplayCount;
        setCurrentPageNftList(nftList_.slice(_startIndex, _endIndex));
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
                flexGrow: 1,
                p: 3,
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
                            Current Auctions
                        </h2>
                        <div style={{
                            borderRadius: '0.5rem',
                            marginTop: '0.75rem'
                        }}>
                            <section style={{
                                paddingTop: '0.75rem'
                            }}>
                                <div style={{
                                    position: 'relative',
                                    borderBottom: '1px solid whitesmoke',
                                }}>
                                </div>
                            </section>
                        </div>
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
                                                history.push(`/auction-details/${item._id}`);
                                            }}
                                        />
                                    </Box>
                                })
                            }
                        </Box>
                        <Box>
                            {
                                nftList?.length > 0 &&
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
                                            resetNftListToDisplay(value, nftList);
                                            setNftPageIndex(value);
                                        }}
                                        count={parseInt(nftList.length / pagenationDisplayCount) + (nftList.length % pagenationDisplayCount !== 0 ? 1 : 0)}
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
