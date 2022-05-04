import React from "react";
import { Button, Card } from "react-bootstrap";
import IncentiveContract from "./smartContract";

export default function AccountsTable() {
  const [accounts, setAccounts] = React.useState([]);

  async function getEvents() {
    try {
      const events = await IncentiveContract.getNewIncentiveEvents();
      console.log(events);
    } catch (e) {
      console.error("Error getting events: " + e);
    }
  }

  return (
    <Card>
      <Button onClick={getEvents}>Get accounts</Button>
    </Card>
  );
}
