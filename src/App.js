import { Link, BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { ethers } from "ethers";
import PublicSocialMediaAbi from "./contractsData/publicSocialMedia.json";
import PublicSocialMediaAddress from "./contractsData/publicSocialMedia-address.json";
import { Spinner, Navbar, Nav, Button, Container } from "react-bootstrap";
import Home from "./Home.js";
import Profile from "./Profile.js";
import "./App.css";

// const cors = require("cors");
// const corsOptions = {
//     origin: "*",
//     credentials: true, //access-control-allow-credentials:true
//     optionSuccessStatus: 200,
// };

// App.use(cors(corsOptions)); // Use this after the variable declaration

function App() {
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState({});

    const web3Handler = async () => {
        let accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);

        // Setup event listeners for metamask
        window.ethereum.on("chainChanged", () => {
            window.location.reload();
        });
        window.ethereum.on("accountsChanged", async () => {
            setLoading(true);
            web3Handler();
        });
        // Get provider from Metamask
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        // Get signer
        const signer = provider.getSigner();
        loadContract(signer);
    };
    const loadContract = async (signer) => {
        // Get deployed copy of Public social media contract
        const contract = new ethers.Contract(
            PublicSocialMediaAddress.address,
            PublicSocialMediaAbi.abi,
            signer
        );
        setContract(contract);
        setLoading(false);
    };
    return (
        <BrowserRouter>
            <div className="App">
                <>
                    <Navbar expand="lg" bg="secondary" variant="dark">
                        <Container>
                            <Navbar.Brand> Public Social Media</Navbar.Brand>
                            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                            <Navbar.Collapse id="responsive-navbar-nav">
                                <Nav className="me-auto">
                                    <Nav.Link as={Link} to="/">
                                        Home
                                    </Nav.Link>
                                    <Nav.Link as={Link} to="/profile">
                                        Profile
                                    </Nav.Link>
                                </Nav>
                                <Nav>
                                    {account ? (
                                        <Nav.Link
                                            href={`https://etherscan.io/address/${account}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="button nav-button btn-sm mx-4"
                                        >
                                            <Button variant="outline-light">
                                                {account.slice(0, 5) +
                                                    "..." +
                                                    account.slice(38, 42)}
                                            </Button>
                                        </Nav.Link>
                                    ) : (
                                        <Button
                                            onClick={web3Handler}
                                            variant="outline-light"
                                        >
                                            Connect Wallet
                                        </Button>
                                    )}
                                </Nav>
                            </Navbar.Collapse>
                        </Container>
                    </Navbar>
                </>
                <div>
                    {loading ? (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                minHeight: "80vh",
                            }}
                        >
                            <Spinner
                                animation="border"
                                style={{ display: "flex" }}
                            />
                            <p className="mx-3 my-0">
                                Please connect your Metamask wallet...
                            </p>
                        </div>
                    ) : (
                        <Routes>
                            <Route
                                path="/"
                                element={<Home contract={contract} />}
                            />
                            <Route
                                path="/profile"
                                element={<Profile contract={contract} />}
                            />
                        </Routes>
                    )}
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;
