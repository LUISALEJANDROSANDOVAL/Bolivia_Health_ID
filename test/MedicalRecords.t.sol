// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MedicalRecords} from "../src/MedicalRecords.sol";

contract MedicalRecordsTest is Test {
    MedicalRecords public medicalRecords;

    address public admin = address(1);
    address public doctor = address(2);
    address public patient = address(3);
    address public nonDoctor = address(4);

    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    event RecordAdded(address indexed patient, address indexed doctor, string ipfsHash);

    function setUp() public {
        // Deploy contract as admin
        vm.prank(admin);
        medicalRecords = new MedicalRecords();

        // Admin grants DOCTOR_ROLE to doctor
        vm.prank(admin);
        medicalRecords.grantRole(DOCTOR_ROLE, doctor);
    }

    function testConstructorAdminRole() public {
        assertTrue(medicalRecords.hasRole(DEFAULT_ADMIN_ROLE, admin));
    }

    function testGrantDoctorRole() public {
        address newDoctor = address(5);
        
        vm.prank(admin);
        medicalRecords.grantRole(DOCTOR_ROLE, newDoctor);

        assertTrue(medicalRecords.hasRole(DOCTOR_ROLE, newDoctor));
    }

    function testAddRecordAsDoctor() public {
        string memory ipfsHash = "QmZTrQe9q8zP4yKkF8vHabc123456789";

        // Expect the RecordAdded event to be emitted
        vm.expectEmit(true, true, false, true);
        emit RecordAdded(patient, doctor, ipfsHash);

        vm.prank(doctor);
        medicalRecords.addRecord(patient, ipfsHash);

        // Retrieve and check the record
        MedicalRecords.Record[] memory records = medicalRecords.getRecords(patient);
        assertEq(records.length, 1);
        assertEq(records[0].ipfsHash, ipfsHash);
        assertEq(records[0].doctor, doctor);
        assertEq(records[0].timestamp, block.timestamp);
    }

    function testGetRecords() public {
        string memory hash1 = "QmHash1";
        string memory hash2 = "QmHash2";

        vm.prank(doctor);
        medicalRecords.addRecord(patient, hash1);

        vm.prank(doctor);
        medicalRecords.addRecord(patient, hash2);

        MedicalRecords.Record[] memory records = medicalRecords.getRecords(patient);
        assertEq(records.length, 2);
        assertEq(records[0].ipfsHash, hash1);
        assertEq(records[1].ipfsHash, hash2);
    }

    function testAddRecordFailAsNonDoctor() public {
        string memory ipfsHash = "QmZTrQe9q8zP4yKkF8vHabc123456789";

        // Should revert because nonDoctor doesn't have DOCTOR_ROLE
        vm.expectRevert();
        vm.prank(nonDoctor);
        medicalRecords.addRecord(patient, ipfsHash);
    }
}
