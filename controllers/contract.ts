import { BaseContract } from "ethers";
import { ethers } from "ethers";
import dotenv from "dotenv";
// my_contract.ts
class MyContract extends BaseContract {
    create_contract() {
      // Implement the create_contract method here
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS ?? "", process.env.ABI ?? [], provider);
    return contract;
    }
    addUser(walletAddress: string) {
      // Implement the addUser method here
    }
  
    addUrl(title: string, url: string, submittedBy: string, id: string) {
      // Implement the addUrl method here
    }
  }

export default MyContract;