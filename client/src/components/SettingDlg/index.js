import React, { useEffect, useState } from 'react';

import {
    Button,
} from '@mui/material';
import { getRequest } from 'assets/api/apiRequests';
import * as env from "../../env.js";

const BUTTON_COLOR = '#fb497e';

const MAIN_BUTTON_STYLE = {
    width: '120px',
    height: '48px',
    borderRadius: '24px',
    textTransform: 'none',
    fontSize: 18,
    fontWeight: 700,
    color: 'white',
    padding: '0 25px',
    backgroundColor: `${BUTTON_COLOR}`,
    margin: '5px 0',
    marginRight: '20px',
    '&:hover': {
        backgroundColor: `${BUTTON_COLOR}`,
        boxShadow: 'none',
    },
    '&:focus': {
        outline: 'none',
        boxShadow: 'none',
    }
};

function SettingDlg({
    nettype,
    onSet,
    onCancel
}) {
    const [treasuryID, setTreasuryID] = useState("");
    const [treasuryPVKey, setTreasuryPVKey] = useState("");
    const [treasuryFeeID, setTreasuryFeeID] = useState("");
    const [netType, setNetType] = useState(nettype);
    const [adminPassword, setAdminPassword] = useState("");


    useEffect(() => {
        async function setupInitData() {
            var treasury_id_res = await getRequest(env.SERVER_URL + "/api/control/get_treasury_id")
            setTreasuryID(treasury_id_res.data)
            var treasury_fee_id_res = await getRequest(env.SERVER_URL + "/api/control/get_treasury_fee_id")
            setTreasuryFeeID(treasury_fee_id_res.data)
        }
        setupInitData();
    }, []);

    const onPrepare = () => {
        const info = {
            a: btoa(treasuryID),
            b: btoa(treasuryPVKey),
            c: btoa(treasuryFeeID),
            d: btoa(netType),
            e: btoa(adminPassword)
        };
        onSet(info);
    }

    return (
        <div className="self-center bg-[#ffc0ff]">
            <div className="text_black w-full flex flex-col items-center justify-center p-5">
                <div className="text-5xl">
                    <span className="bold text-[#8b1832]">Welcome to the admin page</span>
                </div>
                <div className='flex flex-col justify-center w-[70%]'>
                    <div className='py-4'>
                        <div className='py-2'>
                            <label for="helper-text" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Treasury Wallet ID</label>
                            <input type="email" value={treasuryID} onChange={(e) => setTreasuryID(e.target.value)} id="helper-text" aria-describedby="helper-text-explanation" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Treasury Wallet ID" />
                        </div>
                        <div className='py-2'>
                            <label for="helper-text" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Treasury Wallet Private Key</label>
                            <textarea id="message" value={treasuryPVKey} onChange={(e) => setTreasuryPVKey(e.target.value)} rows="2" className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Treasury Wallet Private Key"></textarea>
                        </div>
                        <div className='py-2'>
                            <label for="helper-text" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Treasury Fee Wallet ID</label>
                            <input type="email" value={treasuryFeeID} onChange={(e) => setTreasuryFeeID(e.target.value)} id="helper-text" aria-describedby="helper-text-explanation" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Treasury Fee Wallet ID" />
                        </div>
                        <div className='py-2'>
                            <label for="helper-text" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Admin Password</label>
                            <input type="email" defaultValue={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} id="helper-text" aria-describedby="helper-text-explanation" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Admin Password" />
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                value=""
                                className="sr-only peer"
                                checked={netType === "testnet" ? false : true}
                                onClick={() => {
                                    if (netType === "testnet")
                                        setNetType("testnet");
                                    else
                                        setNetType("mainnet");
                                }} />
                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">{netType}</span>
                        </label>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Button onClick={() => { onPrepare() }}
                        sx={MAIN_BUTTON_STYLE}
                        disabled={treasuryID === "" || treasuryPVKey === "" | treasuryFeeID === "" | adminPassword === ""}
                    >
                        Set
                    </Button>
                    <Button onClick={() => { onCancel() }}
                        sx={MAIN_BUTTON_STYLE}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default SettingDlg;
