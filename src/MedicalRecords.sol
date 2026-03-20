// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MedicalRecords
 * @dev Contrato para administrar permisos y hashes IPFS de expedientes médicos.
 * Se apoya en OpenZeppelin AccessControl para seguridad robusta.
 */
contract MedicalRecords is AccessControl {
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");

    struct Record {
        string ipfsHash;    // Aquí se guarda el CID de Lighthouse
        uint256 timestamp;
        address doctor;
    }

    // Mapping: patientAddress => array of Records
    mapping(address => Record[]) private patientRecords;

    event RecordAdded(address indexed patient, address indexed doctor, string ipfsHash);

    constructor() {
        // En un caso real, la fábrica o clínica sería el ADMIN
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Registra un documento médico en la blockchain usando un hash IPFS.
     * Solo las direcciones con el rol DOCTOR_ROLE pueden agregar registros.
     */
    function addRecord(address patient, string memory ipfsHash) external onlyRole(DOCTOR_ROLE) {
        require(patient != address(0), "Paciente invalido");
        require(bytes(ipfsHash).length > 0, "Hash vacio");

        patientRecords[patient].push(Record({
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            doctor: msg.sender
        }));

        emit RecordAdded(patient, msg.sender, ipfsHash);
    }

    /**
     * @dev Retorna los expedientes del paciente especificado.
     * En el UI, Account Abstraction se asegurará de que sea consultado 
     * mediante la firma correcta.
     */
    function getRecords(address patient) external view returns (Record[] memory) {
        return patientRecords[patient];
    }
}
