// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MedicalRecords} from "../src/MedicalRecords.sol";

contract DeployMedicalRecords is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        MedicalRecords medicalRecords = new MedicalRecords();
        
        console.log("MedicalRecords deployed at:", address(medicalRecords));

        vm.stopBroadcast();
    }
}
