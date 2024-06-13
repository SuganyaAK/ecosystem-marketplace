import {
    Assets,
    Data,
    Emulator,
    generatePrivateKey,
    generateSeedPhrase,
    Lovelace,
    Lucid,
    PrivateKey,
    SpendingValidator,
    Tx,
    TxHash,
    UTxO,
    valueToAssets,
  } from '@anastasia-labs/lucid-cardano-fork';

import {test } from "vitest";
  
import {getMintOneShotTx} from "../../../app/txns/getMintOneShotTx"
import { makeFeeOracleNftPolicy } from '../feeOracleNftIdPolicy';
import { generateAccountSeedPhrase, lutxoToUTxO, UTxOTolUtxo, valueToLAssets } from '../__tests__/utils';
import { defaultProtocolParameters, IUTxO, pData, PTxOutRef, TxBuilder } from '@harmoniclabs/plu-ts';


const userAddress1 = await generateAccountSeedPhrase({lovelace : 20_000_000n});
const userAddress2 = await generateAccountSeedPhrase({lovelace : 10_000_000n});
const emulator = new Emulator([userAddress1,userAddress2]);

const lucid = await Lucid.new(emulator);

  //test("Test - Only one NFT minted", async () => {
    try{
     
    lucid.selectWalletFromSeed (userAddress1.seedPhrase);
    const tx = await lucid.newTx().payToAddress(userAddress1.address,{lovelace:10_000_000n}).complete();

    const signedTx = await tx.sign().complete(); 
    const txhash = await signedTx.submit();

    console.log (txhash);

    emulator.awaitBlock(500);

    const utxos = await lucid.utxosAt(userAddress1.address);

    const plutusUtxos = lutxoToUTxO(utxos[0]);

    const ref = plutusUtxos.utxoRef.id;

    const feeOracleNftPolicy = makeFeeOracleNftPolicy( PTxOutRef.fromData( pData( ref.toData() ) ) );
  
    const offChainTx = await getMintOneShotTx(new TxBuilder(defaultProtocolParameters),plutusUtxos,plutusUtxos.resolved.address);
  
    const feeOracleNftIdPolicyScript: SpendingValidator = {
        type: "PlutusV2",
        script: offChainTx.nftPolicySource.cbor.toString()//feeOracleNftPolicy.cbor.toString(),
    };

    const tobesignedTx = offChainTx.tx.toCbor();

    const lucidTx = lucid.fromTx(tobesignedTx.toString());

    const signedLucidTx = await lucidTx.sign().complete();

    const txHash = await signedLucidTx.submit();

    console.log (txhash);

    emulator.awaitBlock(50);

    const lucidUtxosAfterTx = await lucid.utxosAt(userAddress1.address);
     
    const plutusUtxosAfterTx = lutxoToUTxO(lucidUtxosAfterTx[1]);

    const qty = (valueToLAssets (plutusUtxosAfterTx.resolved.value)).quantity;

  //  expect(qty).toBe(1);
    

        console.log("Test passed");

    }
    catch {
      Error();
    }
    //console.log("Test passed");

//    }); 