import {
    Assets,
    assetsToValue,
    Data,
    Emulator,
    generatePrivateKey,
    generateSeedPhrase,
    Lovelace,
    Lucid,
    paymentCredentialOf,
    PrivateKey,
    SpendingValidator,
    TxHash,
    UTxO as LUTxO,
    valueToAssets,
  } from "../../index"

import {test } from "vitest";
  
import {getMintOneShotTx} from "../../../app/txns/getMintOneShotTx"
import { makeFeeOracleNftPolicy } from '../feeOracleNftIdPolicy';
import { makeFeeOracleAndGetDeployTx } from '../../../app/txns/feeOracle/makeFeeOracleAndGetDeployTx';
import { generateAccountSeedPhrase, getUtxoWithAssets, lutxoToUTxO, UTxOTolUtxo, valueToLAssets } from '../__tests__/utils';
import { Tx,Address, defaultProtocolParameters, Hash28, UTxO, pData, PTxOutRef, PubKeyHash, PublicKey, Script, TxBuilder, Value, DataI } from '@harmoniclabs/plu-ts';
import { tokenName } from '../../../app/constants';
  
test("Test - Failure case multiple NFT minted", async () => {
      
    const userAddress1 = await generateAccountSeedPhrase({lovelace : 20_000_000n});
    const emulator = new Emulator([userAddress1]);
    const lucid = await Lucid.new(emulator);

    lucid.selectWalletFromSeed (userAddress1.seedPhrase);

    const mocktx = await lucid.newTx().payToAddress(userAddress1.address,{lovelace:10_000_000n}).complete();
  
    const mocksignedTx = await mocktx.sign().complete(); 
    const txhash = await mocksignedTx.submit();
  
    console.log ("Tx hash",txhash);
  
    emulator.awaitBlock(500);
  
    const utxos = await lucid.utxosAt(userAddress1.address);

    const plutusUtxos = lutxoToUTxO(utxos[0]);

    
    const utxo = plutusUtxos;
    const addr = plutusUtxos.resolved.address;
    
    const ref = plutusUtxos.utxoRef;

    const txbuilder = new TxBuilder(defaultProtocolParameters)
    const feeOracleNftPolicy = makeFeeOracleNftPolicy( PTxOutRef.fromData( pData( ref.toData() ) ) );
    
    const policy = feeOracleNftPolicy.hash;
    
    const mintedValue = new Value([
            Value.singleAssetEntry(
                policy,
                tokenName,
                3 // a higher quantity is passed to check if the contract mints multiple NFTs
            )
        ]);
    
    const tx = txbuilder.buildSync({
                inputs: [{ utxo }],
                collaterals: [ utxo ],
                collateralReturn: {
                    address: addr,
                    value: Value.sub(
                        plutusUtxos.resolved.value,
                        Value.lovelaces( 5_000_000 )
                    )
                },
                mints: [
                    {
                        value: mintedValue,
                        script: {
                            inline: feeOracleNftPolicy,
                            policyId: policy,
                            redeemer: new DataI( 0 )
                        }
                    }
                ],
                changeAddress: addr
            });
    
       expect(tx).toBe("error"); 

     /*   const tobeSignedTx = lucid.fromTx(tx.toCbor().toString());

       const signedTx = await tobeSignedTx.sign().complete();

       const txHash = await signedTx.submit();

       console.log("Tx hash", txHash); */

        });