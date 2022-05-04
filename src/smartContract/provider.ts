import { JsonRpcProvider } from "@ethersproject/providers";

const provider = new JsonRpcProvider("https://rpc.gnosischain.com", { name: "Gnosis", chainId: 100 });

export default provider;
