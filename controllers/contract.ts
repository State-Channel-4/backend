import { BaseContract } from "ethers";
import { ethers } from "ethers";
import dotenv from "dotenv";

// my_contract.ts
class MyContract extends BaseContract {
  addUser(walletAddress: string) {
      // Implement the addUser method here
    }
  
    addUrl(title: string, url: string, submittedBy: string, id: string) {
      // Implement the addUrl method here
    }
  }

export default MyContract;