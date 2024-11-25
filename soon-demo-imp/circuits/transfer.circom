pragma circom 2.1.4;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/bitify.circom";

template FileTransfer() {
    signal input fileHash;
    signal input sender;
    signal input recipient;
    signal input cidHash;
    
    signal output commitment;
    
    // Hash the inputs using Poseidon
    component hasher = Poseidon(4);
    hasher.inputs[0] <== fileHash;
    hasher.inputs[1] <== sender;
    hasher.inputs[2] <== recipient;
    hasher.inputs[3] <== cidHash;
    
    // Output the commitment
    commitment <== hasher.out;
}

component main = FileTransfer();