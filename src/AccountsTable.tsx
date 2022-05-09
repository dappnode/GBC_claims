import React, { useState } from "react";
import { Table, Button, Card } from "react-bootstrap";
import IncentiveContract from "./smartContracts/incentiveContract/index";
import { AddressIncentiveProgram } from "./smartContracts/incentiveContract/types";

export default function AccountsTable() {
  const [addresses, setAddresses] = useState([] as AddressIncentiveProgram[]);

  async function getAddresses() {
    try {
      const addresses = await IncentiveContract.getAddresses();
      setAddresses(addresses);
      console.log(addresses);
    } catch (e) {
      console.error("Error getting addresses: " + e);
    }
  }

  return (
    <Card>
      <Button variant="primary" onClick={getAddresses}>
        Get addresses
      </Button>
      <Table striped bordered hover variant="dark">
        <thead>
          <tr>
            <th>#</th>
            <th>Address</th>
            <th>Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        {addresses &&
          addresses.map((address, index) => (
            <tbody key={index}>
              <tr>
                <td>{index}</td>
                <td>{address.address}</td>
                <td>{address.status}</td>
                <td>{address.timestamp}</td>
              </tr>
            </tbody>
          ))}
      </Table>
    </Card>
  );
}
