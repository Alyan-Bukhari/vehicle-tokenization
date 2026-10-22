export default {
  "address": import.meta.env.VITE_REGISTRY_ADDRESS || "0x299C09EDb454d85134d9206d420a6655961D60B4",
  "abi": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_treasury",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "string",
          "name": "inspectionId",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "string",
          "name": "inspectionId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "newRegistrationNumber",
          "type": "string"
        }
      ],
      "name": "RegistrationNumberUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "string",
          "name": "inspectionId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "taxAmount",
          "type": "uint256"
        }
      ],
      "name": "TaxAmountSet",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "string",
          "name": "inspectionId",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "taxAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "TaxPaid",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "string",
          "name": "inspectionId",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "registrationNumber",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "registrationFee",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "VehicleRegistered",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "allInspectionIds",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "certificateContract",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "ownerVehicles",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "name": "registrationNumbers",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "treasury",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "name": "usedChassisNumbers",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "name": "vehicles",
      "outputs": [
        {
          "internalType": "string",
          "name": "inspectionId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "make",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "model",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "year",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "engineNumber",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "chassisNumber",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "vehicleType",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "engineCapacity",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "registrationNumber",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "vehicleOwner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "registrationFee",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "registrationFeePaid",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "registrationTimestamp",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "taxAmount",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "taxPaid",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "taxPaidTimestamp",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "registrationTxHash",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "taxTxHash",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "certificate",
          "type": "address"
        }
      ],
      "name": "setCertificateContract",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "inspectionId",
          "type": "string"
        }
      ],
      "name": "vehicleOwnerOf",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_make",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_model",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_year",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_engineNumber",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_chassisNumber",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_vehicleType",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_engineCapacity",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_registrationNumber",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_registrationFee",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_registrationTxHash",
          "type": "string"
        }
      ],
      "name": "registerVehicle",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function",
      "payable": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_taxAmount",
          "type": "uint256"
        }
      ],
      "name": "setTaxAmount",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_taxTxHash",
          "type": "string"
        }
      ],
      "name": "payTax",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function",
      "payable": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        }
      ],
      "name": "getVehicle",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "inspectionId",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "make",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "model",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "year",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "engineNumber",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "chassisNumber",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "vehicleType",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "engineCapacity",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "registrationNumber",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "vehicleOwner",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "registrationFee",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "registrationFeePaid",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "registrationTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "taxAmount",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "taxPaid",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "taxPaidTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "registrationTxHash",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "taxTxHash",
              "type": "string"
            },
            {
              "internalType": "bool",
              "name": "isActive",
              "type": "bool"
            }
          ],
          "internalType": "struct VehicleRegistration.Vehicle",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_registrationNumber",
          "type": "string"
        }
      ],
      "name": "getVehicleByRegistration",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "inspectionId",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "make",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "model",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "year",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "engineNumber",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "chassisNumber",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "vehicleType",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "engineCapacity",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "registrationNumber",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "vehicleOwner",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "registrationFee",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "registrationFeePaid",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "registrationTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "taxAmount",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "taxPaid",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "taxPaidTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "registrationTxHash",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "taxTxHash",
              "type": "string"
            },
            {
              "internalType": "bool",
              "name": "isActive",
              "type": "bool"
            }
          ],
          "internalType": "struct VehicleRegistration.Vehicle",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "getVehiclesByOwner",
      "outputs": [
        {
          "internalType": "string[]",
          "name": "",
          "type": "string[]"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        }
      ],
      "name": "isRegistrationFeePaid",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        }
      ],
      "name": "isTaxPaid",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        }
      ],
      "name": "getTaxAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        }
      ],
      "name": "getPaymentStatus",
      "outputs": [
        {
          "internalType": "bool",
          "name": "registrationPaid",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "taxPaid",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "taxAmount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_newRegistrationNumber",
          "type": "string"
        }
      ],
      "name": "updateRegistrationNumber",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "_newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTotalVehicles",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newTreasury",
          "type": "address"
        }
      ],
      "name": "updateTreasury",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "emergencyWithdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        }
      ],
      "name": "deactivateVehicle",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        }
      ],
      "name": "reactivateVehicle",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_inspectionId",
          "type": "string"
        }
      ],
      "name": "isVehicleActive",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    }
  ]
};

export const NFT_ADDRESS = import.meta.env.VITE_NFT_ADDRESS || "0x7207C81a45bc253bb8Acf227447894208107ecD1";
