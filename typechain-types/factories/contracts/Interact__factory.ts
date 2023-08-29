/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type { Interact, InteractInterface } from "../../contracts/Interact";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "getAllContent",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "string",
            name: "url",
            type: "string",
          },
          {
            internalType: "address",
            name: "submittedBy",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "likes",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "tagIds",
            type: "uint256[]",
          },
        ],
        internalType: "struct Data.Content[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllTags",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "address",
            name: "createdBy",
            type: "address",
          },
          {
            internalType: "uint256[]",
            name: "contentIds",
            type: "uint256[]",
          },
        ],
        internalType: "struct Data.Tag[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllUsers",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "userAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "numberOfLikedContent",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "submittedContent",
            type: "uint256[]",
          },
        ],
        internalType: "struct Data.User[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "url",
        type: "string",
      },
    ],
    name: "getContent",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "string",
            name: "url",
            type: "string",
          },
          {
            internalType: "address",
            name: "submittedBy",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "likes",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "tagIds",
            type: "uint256[]",
          },
        ],
        internalType: "struct Data.Content",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
    ],
    name: "getContentByTag",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "string",
            name: "url",
            type: "string",
          },
          {
            internalType: "address",
            name: "submittedBy",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "likes",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "tagIds",
            type: "uint256[]",
          },
        ],
        internalType: "struct Data.Content[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
    ],
    name: "getTag",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "address",
            name: "createdBy",
            type: "address",
          },
          {
            internalType: "uint256[]",
            name: "contentIds",
            type: "uint256[]",
          },
        ],
        internalType: "struct Data.Tag",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
    ],
    name: "getUser",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "userAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "numberOfLikedContent",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "submittedContent",
            type: "uint256[]",
          },
        ],
        internalType: "struct Data.User",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
    ],
    name: "getUserLikedContent",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "string",
            name: "url",
            type: "string",
          },
          {
            internalType: "address",
            name: "submittedBy",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "likes",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "tagIds",
            type: "uint256[]",
          },
        ],
        internalType: "struct Data.Content[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
    ],
    name: "getUserSubmittedContent",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "string",
            name: "url",
            type: "string",
          },
          {
            internalType: "address",
            name: "submittedBy",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "likes",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "tagIds",
            type: "uint256[]",
          },
        ],
        internalType: "struct Data.Content[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "url",
        type: "string",
      },
      {
        internalType: "address",
        name: "submittedBy",
        type: "address",
      },
    ],
    name: "likeContent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "url",
        type: "string",
      },
      {
        internalType: "address",
        name: "submittedBy",
        type: "address",
      },
    ],
    name: "unlikeContent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class Interact__factory {
  static readonly abi = _abi;
  static createInterface(): InteractInterface {
    return new Interface(_abi) as InteractInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): Interact {
    return new Contract(address, _abi, runner) as unknown as Interact;
  }
}