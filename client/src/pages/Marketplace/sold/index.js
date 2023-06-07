import React, { useState, useEffect } from 'react';

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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';

import { getRequest, postRequest } from "../../../assets/api/apiRequests";
import * as env from "../../../env";

import NavBar from '../../../components/NavBar';
import AppBar from '../../../components/AppBar';

function createData(name, calories, fat, carbs, protein) {
    return { name, calories, fat, carbs, protein };
}

const rows = [
    createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
    createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
    createData('Eclair', 262, 16.0, 24, 6.0),
    createData('Cupcake', 305, 3.7, 67, 4.3),
    createData('Gingerbread', 356, 16.0, 49, 3.9),
];

export default function Sold() {

    const [loadingView, setLoadingView] = useState(false);
    const [soldNftList, setSoldNftList] = useState(null);
    const [alertInfo, setAlertInfo] = useState([]);

    useEffect(() => {
        getSoldNfts();
    }, []);

    // load profile data
    const getSoldNfts = async () => {
        setLoadingView(true);
        const _res = await getRequest(env.SERVER_URL + "/api/soldnftlist/get_sold_list");
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
        setSoldNftList(_res.data);
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
                    <div style={{
                        paddingLeft: '2rem',
                        paddingRight: '2rem',
                        maxWidth: '80rem',
                        paddingTop: '3rem',
                        paddingBottom: '3rem',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                    }}>
                        <h2 style={{
                            letterSpacing: '-.025em',
                            fontWeight: '800',
                            fontSize: '1.5rem',
                            lineHeight: '2rem',
                            margin: 0,
                            fontFamily: 'Poppins,sans-serif',
                            textAlign: 'center',
                            color: '#873135',
                        }}>
                            Sold NFTs
                        </h2>
                        {/*
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                            maxWidth: '800px',
                            paddginTop: '0.25rem',
                            paddingBottom: '0.25rem',
                            paddgingLeft: '0.5rem',
                            paddgingRight: '0.5rem',
                            marginTop: '0.5rem',
                            marginBottom: '0.5rem',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            borderRadius: '0.5rem',
                            lineStyle: 'none',
                            fontFamily: 'Poppins,sans-serif',
                            textAlign: 'center',
                            color: '#fff',
                        }}>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: 'rgba(31,41,55,1)',
                                borderRadius: '0.5rem',
                                margin: '0.25rem',
                            }}>
                                <div style={{
                                    color: 'rgba(156,163,175,1)',
                                    fontSize: '.75rem',
                                    lineHeight: '1rem',
                                    marginBottom: '0.25rem',
                                }}>
                                    TOTAL VOLUME
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    rowGap: '0.25rem',
                                    columnGap: '1rem',
                                    flexWrap: 'wrap',
                                }}>
                                    <p style={{
                                        textTransform: 'capitalize',
                                        fontWeight: '500',
                                        fontSize: '.875rem',
                                        lineHeight: '1.25rem',
                                        marginLeft: 'auto',
                                        marginRight: 'auto',
                                        margin: 0,
                                        textAlign: 'center',
                                    }}>
                                        139,417,606.864 HBAR
                                    </p>
                                </div>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: 'rgba(31,41,55,1)',
                                borderRadius: '0.5rem',
                                margin: '0.25rem',
                            }}>
                                <div style={{
                                    color: 'rgba(156,163,175,1)',
                                    fontSize: '.75rem',
                                    lineHeight: '1rem',
                                    marginBottom: '0.25rem',
                                }}>
                                    AVG SALE PRICE
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    rowGap: '0.25rem',
                                    columnGap: '1rem',
                                    flexWrap: 'wrap',
                                }}>
                                    <p style={{
                                        textTransform: 'capitalize',
                                        fontWeight: '500',
                                        fontSize: '.875rem',
                                        lineHeight: '1.25rem',
                                        marginLeft: 'auto',
                                        marginRight: 'auto',
                                        margin: 0,
                                        textAlign: 'center',
                                    }}>
                                        1,427.27 HBAR
                                    </p>
                                </div>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: 'rgba(31,41,55,1)',
                                borderRadius: '0.5rem',
                                margin: '0.25rem',
                            }}>
                                <div style={{
                                    color: 'rgba(156,163,175,1)',
                                    fontSize: '.75rem',
                                    lineHeight: '1rem',
                                    marginBottom: '0.25rem',
                                }}>
                                    TOTAL ITEMS SOLD
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    rowGap: '0.25rem',
                                    columnGap: '1rem',
                                    flexWrap: 'wrap',
                                }}>
                                    <p style={{
                                        textTransform: 'capitalize',
                                        fontWeight: '500',
                                        fontSize: '.875rem',
                                        lineHeight: '1.25rem',
                                        marginLeft: 'auto',
                                        marginRight: 'auto',
                                        margin: 0,
                                    }}>
                                        97,681
                                    </p>
                                </div>
                            </div>
                        </div>
                        */}
                        <div style={{
                            padding: '2rem 2rem 2rem 2rem',
                            width: '1024px',
                            margin: 'auto'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <h2 style={{
                                    color: '#873135',
                                    fontSize: '1.25rem',
                                    lineHeight: '1.75rem',
                                    paddginLeft: '0.5rem',
                                    fontWeight: 'inherit',
                                    margin: 0,
                                }}>
                                    Recent sales
                                </h2>
                            </div>
                            <div style={{
                                display: 'flex',
                                position: 'relative',
                                alignItems: 'center',
                                paddingTop: '0.5rem',
                            }}>
                                <div style={{
                                    flexGrow: '1',
                                    border: '1px solid #873135',
                                }}>
                                </div>
                            </div>
                            {
                                soldNftList?.length === 0 &&
                                <div style={{
                                    color: '#873135',
                                    fontSize: '1rem',
                                    margin: '2rem 0',
                                    textAlign: 'center',
                                }}>No data</div>
                            }
                            {
                                soldNftList?.length > 0 &&
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    margin: '2rem 0',
                                    overflowX: 'auto',
                                    verticalAlign: 'middle',
                                    minWidth: '100%',
                                    border: '2px solid #873135',
                                    borderRadius: '0.5rem',
                                }}>
                                    <TableContainer
                                        sx={{
                                            minWidth: '100%',
                                            borderCollapse: 'collapse',
                                            textIndent: 0,
                                            borderColor: 'inherit',
                                            backgroundColor: '#ffc0ff',
                                        }}
                                        component={Paper}
                                    >
                                        <Table sx={{ minWidth: 700 }} aria-label="customized table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell></TableCell>
                                                    <TableCell sx={TABLE_HEAD_CELL_STYLE} align="left">Name</TableCell>
                                                    <TableCell sx={TABLE_HEAD_CELL_STYLE} align="left">TRANSACTION TYPE</TableCell>
                                                    <TableCell sx={TABLE_HEAD_CELL_STYLE} align="left">TIME</TableCell>
                                                    <TableCell sx={TABLE_HEAD_CELL_STYLE} align="left">TOTAL AMOUNT</TableCell>
                                                    <TableCell sx={TABLE_HEAD_CELL_STYLE} align="left">BUYER</TableCell>
                                                    <TableCell sx={TABLE_HEAD_CELL_STYLE} align="left">SELLER</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {
                                                    soldNftList.map((item, index) => (
                                                        <TableRow
                                                            sx={{
                                                                '&:hover': {
                                                                    cursor: 'pointer',
                                                                    opacity: '70%',
                                                                },
                                                            }}
                                                            key={index}
                                                        >
                                                            <TableCell align="left">
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
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: '1rem' }} align="left">{item.name}</TableCell>
                                                            <TableCell align="left">
                                                                <div
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        color: 'whitesmoke',
                                                                        lineHeight: '1.25rem',
                                                                        fontWeight: '600',
                                                                        fontSize: '1rem',
                                                                        padding: '0 0.5rem 0 0.5rem',
                                                                        backgroundColor: 'rebeccapurple',
                                                                        borderRadius: '9999px',
                                                                    }}
                                                                >
                                                                    {item.transactionType}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: '1rem' }} align="left">{item.soldTime}</TableCell>
                                                            <TableCell sx={{ fontSize: '1rem' }} align="left">{item.totalAmount} ℏ</TableCell>
                                                            <TableCell sx={{ fontSize: '1rem' }} align="left">{item.buyer}</TableCell>
                                                            <TableCell sx={{ fontSize: '1rem' }} align="left">{item.seller}</TableCell>
                                                        </TableRow>
                                                    ))
                                                }
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </div>
                            }
                        </div>
                    </div>
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

const TABLE_HEAD_CELL_STYLE = {
    fontSize: '1rem',
    fontWeight: '600',
    lineHeight: '1.25rem',
    color: '#873135',
};

const TABLE_TD_STYLE = {
    padding: '1rem 1.5rem 1rem 1.5rem',
    whiteSpace: 'nowrap',
};