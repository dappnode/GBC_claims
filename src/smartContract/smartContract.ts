import { Contract, Event, EventFilter } from "ethers";
import abi from "./abi";
import address from "./address";
import provider from "./provider";
import { AddressToIncentive } from "./types";

export class SmartContract extends Contract {
  constructor() {
    super(address, abi, provider);
  }

  /**
   * @returns NewIncentive events in array format
   */
  public async getNewIncentiveEvents(): Promise<Event[]> {
    const eventFilter: EventFilter = {
      address: address,
      topics: ["0x406d6c7c5c3cbaca88bd5793fa74947c6c28bb949a9e9bec03f3e2ee05eec6b8"],
    };
    return await super.queryFilter(eventFilter, 21549530, "latest");
  }

  /**
   * @returns struct {endTime, isClaimed}
   */
  public async addressToIncentive(): Promise<AddressToIncentive> {
    return await super.addressToIncentive();
  }
}
