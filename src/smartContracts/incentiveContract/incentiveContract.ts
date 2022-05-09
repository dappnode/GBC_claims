import { Contract, ethers, Event, EventFilter } from "ethers";
import abi from "./abi";
import address from "./address";
import provider from "../provider";
import { AddressIncentiveProgram, AddressStatus, AddressToIncentive } from "./types";
import { Interface } from "ethers/lib/utils";

export class IncentiveContract extends Contract {
  iface: Interface;
  constructor() {
    super(address, abi, provider);
    this.iface = new ethers.utils.Interface(abi);
  }

  public async getAddresses(): Promise<AddressIncentiveProgram[]> {
    const eventsDefault = await this.getNewIncentiveEventsDefault();
    console.log(eventsDefault);
    const eventsMultisig = await this.getNewIncentiveEventsMultisig();
    console.log(eventsMultisig);
    const addressesDefault = await this.getAddBeneficiariesInput(eventsDefault);
    const addressesMultisig = await this.getExecTransactionInput(eventsMultisig);
    return [...addressesDefault, ...addressesMultisig];
  }

  /**
   * Get the incentives created with the default SC function addBeneficiaries
   * @returns NewIncentive events in array format
   */
  private async getNewIncentiveEventsDefault(): Promise<Event[]> {
    const eventFilter: EventFilter = {
      address: address,
      topics: ["0x406d6c7c5c3cbaca88bd5793fa74947c6c28bb949a9e9bec03f3e2ee05eec6b8"], // NewIncentive topic event
    };

    return await super.queryFilter(eventFilter, 19979173, 21364394);
  }

  /**
   * Get the incentives created with the multisig execTransaction function
   * @returns NewIncentive events in array format
   */
  private async getNewIncentiveEventsMultisig(): Promise<Event[]> {
    const eventFilter: EventFilter = {
      address: address,
      topics: ["0x406d6c7c5c3cbaca88bd5793fa74947c6c28bb949a9e9bec03f3e2ee05eec6b8"], // NewIncentive topic event
    };
    return await super.queryFilter(eventFilter, 21364395, "latest");
  }

  /**
   * Get the input addresses for the incentives created with the multisig execTransaction function
   * @returns addresses in array format
   */
  private async getExecTransactionInput(events: Event[]): Promise<AddressIncentiveProgram[]> {
    const addresses: AddressIncentiveProgram[] = [];
    for (const event of events) {
      const transaction = await provider.getTransaction(event.transactionHash);

      const ifaceMultisig = new Interface([
        "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures)",
      ]);

      const multisigDataDecoded = ifaceMultisig.decodeFunctionData("execTransaction", transaction.data);
      const decoded = this.interface.decodeFunctionData("addBeneficiaries", multisigDataDecoded.data);

      const decodedAddresses: string[] = decoded.addressArray;
      const uniqueAddresses: string[] = decodedAddresses.filter(
        (address: string) => !addresses.map((address: AddressIncentiveProgram) => address.address).includes(address)
      );

      const addressesToIncentive: AddressIncentiveProgram[] = await Promise.all(
        uniqueAddresses.map(async (address: string) => {
          return {
            address,
            status: await this.getAddressStatus(address).catch(() => "unknown"),
            timestamp: transaction.timestamp ? new Date(transaction.timestamp * 1000).toLocaleString() : "",
          };
        })
      );
      addresses.push(...addressesToIncentive);
    }
    return addresses;
  }

  /**
   * Get the incentives created with the default SC function addBeneficiaries
   * @returns addresses in array format
   */
  private async getAddBeneficiariesInput(events: Event[]): Promise<AddressIncentiveProgram[]> {
    const addresses: AddressIncentiveProgram[] = [];
    for (const event of events) {
      const transaction = await provider.getTransaction(event.transactionHash);
      const decoded = this.interface.decodeFunctionData("addBeneficiaries", transaction.data);

      const decodedAddresses: string[] = decoded.addressArray;
      const uniqueAddresses: string[] = decodedAddresses.filter(
        (address: string) => !addresses.map((address: AddressIncentiveProgram) => address.address).includes(address)
      );

      const addressesToIncentive: AddressIncentiveProgram[] = await Promise.all(
        uniqueAddresses.map(async (address: string) => {
          return {
            address,
            status: await this.getAddressStatus(address).catch(() => "unknown"),
            timestamp: transaction.timestamp ? new Date(transaction.timestamp * 1000).toLocaleString() : "",
          };
        })
      );
      addresses.push(...addressesToIncentive);
    }
    return addresses;
  }

  /**
   * @returns the status of an address
   */
  private async getAddressStatus(address: string): Promise<AddressStatus> {
    const addressToIncentive: AddressToIncentive = await this.addressToIncentive(address); // returns struct {endTime, isClaimed}
    const isClaimed = addressToIncentive.isClaimed;
    const endTime = addressToIncentive.endTime;

    if (isClaimed) return "claimed";
    if (endTime === 0) return "notWhitelisted";
    if (endTime < Math.floor(Date.now() / 1000)) return "expired";
    if (endTime > Math.floor(Date.now() / 1000)) return "pending";
    return "renewed";
  }
}
