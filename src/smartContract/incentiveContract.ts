import { Contract, ethers, Event, EventFilter } from "ethers";
import abi from "./abi";
import address from "./address";
import provider from "./provider";
import { AddressIncentiveProgram, AddressStatus, AddressToIncentive } from "./types";
import { Interface } from "ethers/lib/utils";

export class IncentiveContract extends Contract {
  iface: Interface;
  constructor() {
    super(address, abi, provider);
    this.iface = new ethers.utils.Interface(abi);
  }

  public async getAddress(addressRequest: string): Promise<AddressIncentiveProgram> {
    return {
      address: addressRequest,
      status: await this.getAddressStatus(addressRequest).catch(() => "unknown"),
      timestamp: "not available",
    };
  }

  public async getAddresses({ onlyLatests }: { onlyLatests: boolean }): Promise<AddressIncentiveProgram[]> {
    if (onlyLatests) {
      const eventsMultisigLatests = await this.getNewIncentiveEventsMultisig({ onlyLatests: true });
      return (await this.getExecTransactionInput(eventsMultisigLatests)).reverse();
    } else {
      const eventsDefault = await this.getNewIncentiveEventsDefault();
      const eventsMultisig = await this.getNewIncentiveEventsMultisig({ onlyLatests: false });
      const addressesDefault = await this.getAddBeneficiariesInput(eventsDefault);
      const addressesMultisig = await this.getExecTransactionInput(eventsMultisig);
      const reverseAddresses = [...addressesDefault, ...addressesMultisig].reverse();
      // deduplicate addresses
      return reverseAddresses.filter(
        (address: AddressIncentiveProgram, index: number) =>
          reverseAddresses.findIndex((address2: AddressIncentiveProgram) => address.address === address2.address) ===
          index
      );
    }
  }

  /**
   * Get the incentives created with the default SC function addBeneficiaries
   * @returns NewIncentive events in array format
   */
  private async getNewIncentiveEventsDefault(): Promise<Event[]> {
    const eventFilter: EventFilter = {
      address,
      topics: ["0x406d6c7c5c3cbaca88bd5793fa74947c6c28bb949a9e9bec03f3e2ee05eec6b8"], // NewIncentive topic event
    };

    return await super.queryFilter(eventFilter, 19979173, 21364394);
  }

  /**
   * Get the incentives created with the multisig execTransaction function
   * @returns NewIncentive events in array format
   */
  private async getNewIncentiveEventsMultisig({ onlyLatests }: { onlyLatests: boolean }): Promise<Event[]> {
    const eventFilter: EventFilter = {
      address,
      topics: ["0x406d6c7c5c3cbaca88bd5793fa74947c6c28bb949a9e9bec03f3e2ee05eec6b8"], // NewIncentive topic event
    };
    if (onlyLatests) {
      const latestBlock = (await provider.getBlock("latest")).number;
      return await super.queryFilter(eventFilter, latestBlock - 100000, "latest");
    } else {
      return await super.queryFilter(eventFilter, 21364395, "latest");
    }
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

      const timestamp = transaction.blockNumber
        ? new Date((await provider.getBlock(transaction.blockNumber)).timestamp * 1000).toString()
        : "";

      const addressesToIncentive: AddressIncentiveProgram[] = await Promise.all(
        uniqueAddresses.map(async (address: string) => {
          return {
            address,
            status: await this.getAddressStatus(address).catch(() => "unknown"),
            timestamp,
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

      const timestamp = transaction.blockNumber
        ? new Date((await provider.getBlock(transaction.blockNumber)).timestamp * 1000).toString()
        : "";

      const addressesToIncentive: AddressIncentiveProgram[] = await Promise.all(
        uniqueAddresses.map(async (address: string) => {
          return {
            address,
            status: await this.getAddressStatus(address).catch(() => "unknown"),
            timestamp,
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
    const { endTime, isClaimed } = addressToIncentive;

    if (isClaimed) return "claimed";
    if (endTime === 0) return "notWhitelisted";
    if (endTime < Math.floor(Date.now() / 1000)) return "expired";
    if (endTime > Math.floor(Date.now() / 1000)) return "pending";
    return "renewed";
  }
}
