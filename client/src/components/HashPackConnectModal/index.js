import React from "react";
import {
    Button,
    Row,
    Input
} from "reactstrap";
import QRCode from "react-qr-code";
import "./style.scss";

const HsahPackConnectModal = ({ pairingString, connectedAccount, onClickConnectHashPack, onClickCopyPairingStr, onClickDisconnectHashPack }) => {
    return (
        <div className="hashpack-connect-container">
            {
                !connectedAccount &&
                <div className="hashpack-connect-wrapper">
                    <p className="modal-title">Pair Wallet</p>
                    <p className="modal-mini-title">PAIR WITH WALLET</p>
                    <Button className="hashpack-connect-btn" onClick={() => onClickConnectHashPack()}>
                        <img alt="..." src="https://wallet.hashpack.app/assets/favicon/favicon.ico" />
                        <p>HashPack</p>
                    </Button>
                    <p className="modal-mini-title">PAIR WITH CODE</p>
                    <Row className="pair-with-code-wrapper">
                        <Input value={pairingString} readOnly={true} />
                        <Button onClick={() => onClickCopyPairingStr()}>Copy</Button>
                    </Row>
                    <p className="modal-mini-title">PAIR WITH QR CODE</p>
                    <QRCode value={pairingString} />
                </div>
            }
            {
                connectedAccount &&
                <div className="hashpack-connect-wrapper">
                    <p className="modal-title">Disconnect Wallet</p>
                    <Button
                        className="hashpack-connect-btn"
                        onClick={() => onClickDisconnectHashPack()}
                        style={{ margin: "10px auto" }}>
                        Disconnect
                    </Button>
                </div>
            }
        </div>
    );
}

export default HsahPackConnectModal;