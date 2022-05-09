import React, { useState } from "react";
import { Table, Button, Card, Spinner, ButtonGroup, InputGroup, FormControl, Toast } from "react-bootstrap";
import IncentiveContract from "./smartContracts/incentiveContract/index";
import { AddressIncentiveProgram } from "./smartContracts/incentiveContract/types";

export default function AccountsTable() {
  const [inputValue, setInputValue] = useState("");

  const [errorMultipleAddresses, setErrorMultipleAddresses] = useState(false);
  const [errorOneAddress, setErrorOneAddress] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [loadingMultipleAddresses, setLoadingMultipleAddresses] = useState(false);
  const [loadingOneAddress, setLoadingOneAddress] = useState(false);

  const [address, setAddress] = useState<AddressIncentiveProgram | null>(null);
  const [addresses, setAddresses] = useState<AddressIncentiveProgram[]>([]);

  async function getAddress(addressRequest: string) {
    try {
      setLoadingOneAddress(true);
      const address = await IncentiveContract.getAddress(addressRequest.trim());
      setAddress(address);
      setLoadingOneAddress(false);
    } catch (e) {
      setLoadingOneAddress(false);
      setErrorOneAddress(true);
      setErrorMessage(e.message);
      console.error("Error getting address: " + e);
    }
  }

  async function getLatestAddresses() {
    try {
      setLoadingMultipleAddresses(true);
      const addresses = await IncentiveContract.getAddresses({ onlyLatests: true });
      setAddresses(addresses);
      setLoadingMultipleAddresses(false);
    } catch (e) {
      setLoadingMultipleAddresses(false);
      setErrorMultipleAddresses(true);
      setErrorMessage(e.message);
      console.error("Error getting addresses: " + e);
    }
  }

  async function getHistoricalAddresses() {
    try {
      setLoadingMultipleAddresses(true);
      const addresses = await IncentiveContract.getAddresses({ onlyLatests: false });
      setAddresses(addresses);
      setLoadingMultipleAddresses(false);
    } catch (e) {
      setLoadingMultipleAddresses(false);
      setErrorMultipleAddresses(true);
      setErrorMessage(e.message);
      console.error("Error getting addresses: " + e);
    }
  }

  return (
    <>
      <br />

      <Card>
        <Card.Title>Get single address status</Card.Title>
        <Card.Body>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="0XF4JRUfew24g..."
              aria-label="Recipient's username"
              aria-describedby="basic-addon2"
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Button variant="outline-secondary" onClick={() => getAddress(inputValue)}>
              Get address
            </Button>
          </InputGroup>

          {loadingOneAddress ? (
            <Spinner animation="border" variant="primary" />
          ) : errorOneAddress ? (
            <Toast onClose={() => setErrorOneAddress(false)} show={errorOneAddress} delay={5000} autohide bg="danger">
              <Toast.Header closeButton={false}>
                <strong className="mr-auto">Error</strong>
              </Toast.Header>
              <Toast.Body>There was an error getting multiple addresses. {errorMessage}</Toast.Body>
            </Toast>
          ) : address ? (
            <>
              <p>
                Adress: <strong>{address.address}</strong>
              </p>
              <p>
                Status: <strong>{address.status}</strong>
              </p>
              <p>
                Timestamp: <strong>{address.timestamp}</strong>
              </p>
            </>
          ) : null}
        </Card.Body>
      </Card>

      <br />

      <Card>
        <Card.Title>Get multiple addresses status</Card.Title>
        <Card.Body>
          <p>
            Get all the addresses with a high resource consumption, it may take some time (up to 1 minute), or get the
            addresses added during the last 100000 blocks
          </p>
          <ButtonGroup aria-label="First group">
            <Button variant="outline-secondary" onClick={getHistoricalAddresses}>
              Get historical addresses
            </Button>

            <Button variant="outline-secondary" onClick={getLatestAddresses}>
              Get latest addresses
            </Button>
          </ButtonGroup>

          <br />
          <br />

          {loadingMultipleAddresses ? (
            <Spinner animation="border" variant="outline-secondary" />
          ) : errorMultipleAddresses ? (
            <Toast
              onClose={() => setErrorMultipleAddresses(false)}
              show={errorMultipleAddresses}
              delay={5000}
              autohide
              bg="danger"
            >
              <Toast.Header closeButton={false}>
                <strong className="mr-auto">Error</strong>
              </Toast.Header>
              <Toast.Body>There was an error getting multiple addresses. {errorMessage}</Toast.Body>
            </Toast>
          ) : addresses.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              {addresses.map((address, index) => (
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
          ) : null}
        </Card.Body>
      </Card>
    </>
  );
}
