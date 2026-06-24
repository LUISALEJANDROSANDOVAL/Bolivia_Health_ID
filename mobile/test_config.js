import { updatePatientData, getPatientData, loginPatient } from './src/services/patientService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testUpdate() {
  const wallet = '0x4e475c495f2b76624321480a7ecec6946168e865';
  
  await loginPatient(wallet);
  
  const data = await getPatientData(wallet);
  console.log('Before Vitals:', data.vitals);

  const vitalsUpdates = {
    ...data.vitals,
    blood_type: 'O-',
    allergies: 'Penicilina test'
  };

  const success = await updatePatientData(wallet, data.profile, vitalsUpdates);
  console.log('Update success:', success);

  const dataAfter = await getPatientData(wallet);
  console.log('After Vitals:', dataAfter.vitals);
}

testUpdate();
