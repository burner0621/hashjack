import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from "react-router-dom";

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

export default function Marketplace() {
    const { page_number } = useParams();

    const { walletData } = useHashConnect();
    const { accountIds } = walletData;

    let history = useHistory();
    const [loadingView, setLoadingView] = useState(false);
    const [totalListCount, setTotalListCount] = useState(false);
    const [nftList, setNftList] = useState(null);
    const [nftPageIndex, setNftPageIndex] = useState(1);
    const [currentPageNftList, setCurrentPageNftList] = useState([]);
    const [alertInfo, setAlertInfo] = useState([]);

    useEffect(() => {
        getNftList();
    }, [page_number]);

    const getNftList = async () => {
        setLoadingView(true);
        const _res = await getRequest(env.SERVER_URL + "/api/marketplace/get_list?pageNumber=" + page_number + "&displayCount=" + pagenationDisplayCount);
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
        setTotalListCount(_res.totalCount);
        setLoadingView(false);
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
                            Current Listings
                        </h2>
                        <div style={{
                            borderRadius: '0.5rem',
                            marginTop: '0.75rem'
                        }}>
                            <section style={{
                                paddingTop: '0.75rem'
                            }}>
                                <h2 style={{
                                    position: 'absolute',
                                    width: '1px',
                                    height: '1px',
                                    padding: '0',
                                    margin: '-1px',
                                    overflow: 'hidden',
                                    clip: 'rect(0,0,0,0)',
                                    whiteSpace: 'nowrap',
                                    borderWidth: '0'
                                }}>
                                    Filters
                                </h2>
                                <div style={{
                                    position: 'relative',
                                    borderBottom: '1px solid whitesmoke',
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingLeft: '0',
                                        paddingRight: '0',
                                        marginLeft: 'auto',
                                        marginRight: 'auto'
                                    }}>
                                        <div style={{
                                            display: 'inline-block',
                                            position: 'relative',
                                            textAlign: 'left'
                                        }}>
                                            <button style={{
                                                display: 'inline-flex',
                                                color: 'whitesmoke',
                                                fontWeight: '500',
                                                fontSize: '.875rem',
                                                lineHeight: '1.25rem',
                                                padding: '1rem',
                                                backgroundColor: 'rebeccapurple',
                                                borderTopLeftRadius: '0.375rem',
                                                borderTopRightRadius: '0.375rem',
                                                justifyContent: 'center'
                                            }}>
                                                Recently Listed
                                                <ExpandMore sx={{
                                                    flexShrink: '0',
                                                    width: '1.25rem',
                                                    height: '1.25rem',
                                                    marginLeft: '0.25rem',
                                                    marginRight: '-0.25rem',
                                                }} />
                                            </button>
                                        </div>
                                        <div style={{
                                            display: 'block'
                                        }}>
                                            <div style={{
                                                display: 'flow-root'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginLeft: '-1rem',
                                                    marginRight: '-1rem'
                                                }}>
                                                    <div style={{
                                                        display: 'inline-block',
                                                        position: ' relative',
                                                        textAlign: 'left',
                                                        paddingLeft: '1rem',
                                                        paddingRight: '1rem'
                                                    }}>
                                                        <button style={{
                                                            display: 'inline-flex',
                                                            color: 'whitesmoke',
                                                            fontWeight: '500',
                                                            fontSize: '.875rem',
                                                            lineHeight: '1.25rem',
                                                            padding: '1rem',
                                                            backgroundColor: 'rebeccapurple',
                                                            borderTopLeftRadius: '0.375rem',
                                                            borderTopRightRadius: '0.375rem',
                                                            justifyContent: 'center'
                                                        }}>
                                                            Price filter
                                                            <ExpandMore sx={{
                                                                flexShrink: '0',
                                                                width: '1.25rem',
                                                                height: '1.25rem',
                                                                marginLeft: '0.25rem',
                                                                marginRight: '-0.25rem',
                                                            }} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                        <Box>
                            {
                                nftList?.length == 0 &&
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
                                nftList?.length > 0 &&
                                nftList.map((item, index) => {
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
                        <Box>
                            {
                                totalListCount > 0 &&
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
                                            setNftList(null);
                                            history.push(`/marketplace/${value}`);
                                        }}
                                        count={parseInt(totalListCount / pagenationDisplayCount) + (totalListCount % pagenationDisplayCount !== 0 ? 1 : 0)}
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
