import { buildPoseidon } from 'circomlibjs';
import * as snarkjs from 'snarkjs';
import { readFileSync, writeFileSync } from 'fs';

async function generateProof() {
  try {
    // Load circuit
    const circuit = await readFileSync('./circuits/transfer.circom', 'utf8');
    
    // Compile circuit
    const { wasm, zkey } = await snarkjs.zKey.newZKey(circuit, 'powersOfTau28_hez_final_12.ptau');
    
    // Save the compiled circuit
    await writeFileSync('./public/circuits/transfer.wasm', wasm);
    await writeFileSync('./public/circuits/transfer.zkey', zkey);
    
    // Generate verification key
    const vKey = await snarkjs.zKey.exportVerificationKey(zkey);
    await writeFileSync('./public/circuits/verification_key.json', JSON.stringify(vKey));
    
    console.log('Circuit compilation and setup completed successfully');
  } catch (error) {
    console.error('Error generating proof:', error);
    process.exit(1);
  }
}

generateProof();