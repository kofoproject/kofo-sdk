const init_sdk = {"type": "init_sdk", "status": "success", "message": "Init sdk success and connected mqtt server."};
const settlement_info = {
    "makerAmount": "0.500000000000000000000000000000",
    "makerChain": "eth",
    "makerClientId": "02a95024e899468bbe2e091444cd01366b141f1209faef9a3cf76eeb383b7dcfe1",
    "makerCounterChainPubKey": "alice",
    "makerCurrency": "zil",
    "makerFee": "0.000000000000000000000000000000",
    "makerLocktime": 7200,
    "makerOrderId": "null",
    "makerPubKey": "0x047ee4370138916819d252686cdee323c5a01c2a203e00eb3b3fb588df9c79562601615e6969375f7bea207b6051940994d1e45fc221b3073ce2a5b97dc20349b9",
    "roleEnum": "MAKER",
    "settlementId": "1550544053629_0101231005",
    "symbol": null,
    "takerAmount": "9.000000000000000000000000000000",
    "takerChain": "eos",
    "takerClientId": "023fbf8ded0155ef73b25c19e20a4a92f984ffe621e8d1b0a2572e593469c1016e",
    "takerCounterChainPubKey": "0x0421caaf99e3f0069b7889e2ebed593e2daa4d1f01575e1469787abcf02bbc012ee62e020037be4e944edf2a24d589dba389bd3a61df6f2bbc146abda7f39f69a9",
    "takerCurrency": "eos",
    "takerLocktime": 6,
    "takerPubKey": "drunken",
    "chain": "eth",
    "currency": "zil",
    "type": "settlement_info"
};
const pre_approve = {
    "settlementId": "1550544053629_0101231005",
    "roleEnum": "MAKER",
    "chain": "eth",
    "currency": "zil",
    "pubKey": "0x047ee4370138916819d252686cdee323c5a01c2a203e00eb3b3fb588df9c79562601615e6969375f7bea207b6051940994d1e45fc221b3073ce2a5b97dc20349b9",
    "approveTx": {
        "blockHeight": 3894334,
        "gasLimit": 310000,
        "gasPrice": 2000000000,
        "nonce": 41,
        "rawTransaction": "0xf8662984773594008304baf094a35c9c57f23420d6d8dbdba48e5023c2cd7d84d180b844095ea7b300000000000000000000000081adec9478ece1e03bda3d10bbac89abb3ed1265000000000000000000000000000000000000000000000000000000746a528800"
    },
    "type": "pre_approve"
};
const submit_approve = {
    "settlementId": "1550544053629_0101231005",
    "roleEnum": "MAKER",
    "chain": "eth",
    "currency": "zil",
    "pubKey": "0x047ee4370138916819d252686cdee323c5a01c2a203e00eb3b3fb588df9c79562601615e6969375f7bea207b6051940994d1e45fc221b3073ce2a5b97dc20349b9",
    "approveTx": {
        "blockHeight": 3894334,
        "gasLimit": 310000,
        "gasPrice": 2000000000,
        "nonce": 41,
        "rawTransaction": "0xf8662984773594008304baf094a35c9c57f23420d6d8dbdba48e5023c2cd7d84d180b844095ea7b300000000000000000000000081adec9478ece1e03bda3d10bbac89abb3ed1265000000000000000000000000000000000000000000000000000000746a528800"
    },
    "approveTxHash": "0x6b1dbf8e8b2b2636ec2c587d41028e6035f444838880aed55377674d5034e053",
    "type": "submit_approve"
};
const success_approve = {
    "settlementId": "1550544053629_0101231005",
    "roleEnum": "MAKER",
    "chain": "eth",
    "currency": "zil",
    "pubKey": "0x047ee4370138916819d252686cdee323c5a01c2a203e00eb3b3fb588df9c79562601615e6969375f7bea207b6051940994d1e45fc221b3073ce2a5b97dc20349b9",
    "approveTx": {
        "blockHeight": 3894334,
        "gasLimit": 310000,
        "gasPrice": 2000000000,
        "nonce": 41,
        "rawTransaction": "0xf8662984773594008304baf094a35c9c57f23420d6d8dbdba48e5023c2cd7d84d180b844095ea7b300000000000000000000000081adec9478ece1e03bda3d10bbac89abb3ed1265000000000000000000000000000000000000000000000000000000746a528800"
    },
    "approveTxHash": "0x6b1dbf8e8b2b2636ec2c587d41028e6035f444838880aed55377674d5034e053",
    "type": "success_approve"
};
const pre_hash_lock = {
    "settlementId": "1550544053629_0101231005",
    "roleEnum": "MAKER",
    "chain": "eth",
    "currency": "zil",
    "amount": "0.500000000000000000000000000000",
    "pubKey": "0x047ee4370138916819d252686cdee323c5a01c2a203e00eb3b3fb588df9c79562601615e6969375f7bea207b6051940994d1e45fc221b3073ce2a5b97dc20349b9",
    "lockTx": {
        "blockHeight": 3894339,
        "gasLimit": 310000,
        "gasPrice": 2000000000,
        "lockId": "0xfd27aa827f99a7f011216199c455a2e962ffe3aea97cb0889822c592fe0e9c3d",
        "nLockNum": 3894939,
        "nonce": 42,
        "rawTransaction": "0xf8c62a84773594008304baf09481adec9478ece1e03bda3d10bbac89abb3ed126580b8a49e75f6ca0000000000000000000000005c7c9e06cf9faf957fc950887978a9434d0b5abb17b32937a2ab2bfa0160917a5318fb86d817ba792d6b3474e827a2831d5a697f00000000000000000000000000000000000000000000000000000000003b6e9b000000000000000000000000a35c9c57f23420d6d8dbdba48e5023c2cd7d84d1000000000000000000000000000000000000000000000000000000746a528800"
    },
    "type": "pre_hash_lock"
};
const submit_hash_lock = {
    "settlementId": "1550544053629_0101231005",
    "roleEnum": "MAKER",
    "chain": "eth",
    "currency": "zil",
    "amount": "0.500000000000000000000000000000",
    "pubKey": "0x047ee4370138916819d252686cdee323c5a01c2a203e00eb3b3fb588df9c79562601615e6969375f7bea207b6051940994d1e45fc221b3073ce2a5b97dc20349b9",
    "lockTxHash": "0xb1a8318dab04dbab4512adc0e442081be05f25da9707b92a81c97845b054a0e6",
    "type": "submit_hash_lock"
};
const success_hash_lock = {
    "settlementId": "1550544053629_0101231005",
    "roleEnum": "MAKER",
    "chain": "eth",
    "currency": "zil",
    "amount": "0.500000000000000000000000000000",
    "pubKey": "0x047ee4370138916819d252686cdee323c5a01c2a203e00eb3b3fb588df9c79562601615e6969375f7bea207b6051940994d1e45fc221b3073ce2a5b97dc20349b9",
    "lockTx": {
        "blockHeight": 3894339,
        "gasLimit": 310000,
        "gasPrice": 2000000000,
        "lockId": "0xfd27aa827f99a7f011216199c455a2e962ffe3aea97cb0889822c592fe0e9c3d",
        "nLockNum": 3894939,
        "nonce": 42,
        "rawTransaction": "0xf8c62a84773594008304baf09481adec9478ece1e03bda3d10bbac89abb3ed126580b8a49e75f6ca0000000000000000000000005c7c9e06cf9faf957fc950887978a9434d0b5abb17b32937a2ab2bfa0160917a5318fb86d817ba792d6b3474e827a2831d5a697f00000000000000000000000000000000000000000000000000000000003b6e9b000000000000000000000000a35c9c57f23420d6d8dbdba48e5023c2cd7d84d1000000000000000000000000000000000000000000000000000000746a528800"
    },
    "lockTxHash": "0xb1a8318dab04dbab4512adc0e442081be05f25da9707b92a81c97845b054a0e6",
    "type": "success_hash_lock"
};
const pre_refund = {
    "settlementId": "1550544053629_0101231005",
    "roleEnum": "MAKER",
    "chain": "eth",
    "currency": "zil",
    "lockId": "0xfd27aa827f99a7f011216199c455a2e962ffe3aea97cb0889822c592fe0e9c3d",
    "pubKey": "0x047ee4370138916819d252686cdee323c5a01c2a203e00eb3b3fb588df9c79562601615e6969375f7bea207b6051940994d1e45fc221b3073ce2a5b97dc20349b9",
    "refundTx": {
        "blockHeight": 3894940,
        "gasLimit": 310000,
        "gasPrice": 2000000000,
        "nonce": 43,
        "rawTransaction": "0xf8452b84773594008304baf09481adec9478ece1e03bda3d10bbac89abb3ed126580a47249fbb6fd27aa827f99a7f011216199c455a2e962ffe3aea97cb0889822c592fe0e9c3d"
    },
    "type": "pre_refund"
};
const submit_refund = {
    "settlementId": "1550544053629_0101231005",
    "roleEnum": "MAKER",
    "chain": "eth",
    "currency": "zil",
    "lockId": "0xfd27aa827f99a7f011216199c455a2e962ffe3aea97cb0889822c592fe0e9c3d",
    "pubKey": "0x047ee4370138916819d252686cdee323c5a01c2a203e00eb3b3fb588df9c79562601615e6969375f7bea207b6051940994d1e45fc221b3073ce2a5b97dc20349b9",
    "refundTx": {
        "blockHeight": 3894940,
        "gasLimit": 310000,
        "gasPrice": 2000000000,
        "nonce": 43,
        "rawTransaction": "0xf8452b84773594008304baf09481adec9478ece1e03bda3d10bbac89abb3ed126580a47249fbb6fd27aa827f99a7f011216199c455a2e962ffe3aea97cb0889822c592fe0e9c3d"
    },
    "refundTxHash": "0xb80fb77c52124d9ff9274d2a8dcffc9352a67a0973109b83959c46e1563ec534",
    "type": "submit_refund"
};
const success_refund = {
    "settlementId": "1550544053629_0101231005",
    "roleEnum": "MAKER",
    "chain": "eth",
    "currency": "zil",
    "lockId": "0xfd27aa827f99a7f011216199c455a2e962ffe3aea97cb0889822c592fe0e9c3d",
    "pubKey": "0x047ee4370138916819d252686cdee323c5a01c2a203e00eb3b3fb588df9c79562601615e6969375f7bea207b6051940994d1e45fc221b3073ce2a5b97dc20349b9",
    "refundTx": {
        "blockHeight": 3894940,
        "gasLimit": 310000,
        "gasPrice": 2000000000,
        "nonce": 43,
        "rawTransaction": "0xf8452b84773594008304baf09481adec9478ece1e03bda3d10bbac89abb3ed126580a47249fbb6fd27aa827f99a7f011216199c455a2e962ffe3aea97cb0889822c592fe0e9c3d"
    },
    "refundTxHash": "0xb80fb77c52124d9ff9274d2a8dcffc9352a67a0973109b83959c46e1563ec534",
    "type": "success_refund"
};
const complete = {
    "settlementId": "1550544053629_0101231005",
    "roleEnum": "MAKER",
    "chain": "eth",
    "currency": "zil",
    "type": "complete"
};
const init_sdk = {"type":"init_sdk","status":"failed","message":"mqtt server disconnect"}; 
const init_sdk = {"type":"init_sdk","status":"success","message":"mqtt server reconnect"}; 
const init_sdk = {"type":"init_sdk","status":"success","message":"Init sdk success and connected mqtt server."}; 
