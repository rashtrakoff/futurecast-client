import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import "./styles/globals.sass";

import Nav from "./components/Nav";
import Market from "./components/Market";
import MarketGrid from "./components/MarketGrid";
import HeroSection from "./components/HeroSection";
import NewQuestion from "./components/NewQuestion";
import {UserProfile} from "./components/UserProfile";
import EnableWeb3 from "./components/EnableWeb3";

const getMarkets = async (factory, questionInstance) => {
  try {
    const questionAddresses = await factory.methods
      .giveQuestionAddresses()
      .call();

    const markets = Promise.all(
      questionAddresses.map(async (addr) => {
        const thisQuestion = await questionInstance(addr);
        const pubVar = await thisQuestion.methods.publicVariables().call();

        let details = [...pubVar[3]];
        details.push("Invalid");

        pubVar[3] = [...details];

        let values = [...pubVar[2][0]];
        let total = 0;

        values.forEach((value) => (total += parseInt(value)));
        let percentage = values.map((value) =>
          total ? parseFloat((value / total) * 100).toFixed(2) : 0
        );

        pubVar[2] = [[...percentage], [...pubVar[2][1]]];
        pubVar["total"] = total;

        const infoObject = {
          details: { ...pubVar, address: addr },
          questionInstance: thisQuestion,
        };

        return infoObject;
      })
    );

    return markets;
  } catch (e) {
    console.log(e);
  }
};

const App = () => {
  const [factory, setFactory] = useState(null);
  const [questionInstance, setQuestionInstance] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [markets, setMarkets] = useState(null);
  const [wallet, setWallet] = useState(0);

  useEffect(() => {
    if (factory && questionInstance)
      getMarkets(factory, questionInstance).then((markets) =>
        setMarkets(markets)
      );
  }, [factory, questionInstance]);

  return (
    <>
      <EnableWeb3
        setFactory={setFactory}
        setQuestionInstance={setQuestionInstance}
        setWalletAddress={setWalletAddress}
        wallet={wallet}
        setWallet={setWallet}
      />
      <Nav setWallet={setWallet} wallet={wallet} walletAddress={walletAddress}/>
      <Router>
        <Switch>
          <Route path="/" exact>
            <HeroSection />
            <MarketGrid markets={markets} />
          </Route>
          <Route path="/market/:id">
            <Market markets={markets} walletAddress={walletAddress} />
          </Route>
          <Route path="/new-question">
            <NewQuestion walletAddress={walletAddress} factory={factory} />
          </Route>
          <Route path="/profile">
              <UserProfile walletAddress={walletAddress} markets={markets} />
          </Route>
        </Switch>
      </Router>
    </>
  );
};

export default App;
