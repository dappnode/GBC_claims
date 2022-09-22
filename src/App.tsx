import React from "react";
import AccountsTable from "./AccountsTable";

import "./App.scss";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>DAppNode Gnosis Validator Incentive Program</p>
      </header>
      <p>
        DAppNode Gnosis Validator Incentive Program. Check the status of the accounts included in the Gnosis incentive program. SC
        address: 0x6C68322cf55f5f025F2aebd93a28761182d077c3
      </p>
      <AccountsTable />
    </div>
  );
}

export default App;
