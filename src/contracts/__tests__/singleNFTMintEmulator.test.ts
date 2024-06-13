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
    Tx,
    TxHash,
    UTxO,
    valueToAssets,
  } from '@anastasia-labs/lucid-cardano-fork';
  
import {getMintOneShotTx} from "../../../app/txns/getMintOneShotTx"
import { makeFeeOracleNftPolicy } from '../feeOracleNftIdPolicy';
import { makeFeeOracleAndGetDeployTx } from '../../../app/txns/feeOracle/makeFeeOracleAndGetDeployTx';
import { getUtxoWithAssets, lutxoToUTxO, UTxOTolUtxo, valueToLAssets,generateAccountSeedPhrase } from '../__tests__/utils';
import { defaultProtocolParameters, Hash28, IUTxO, pData, PTxOutRef, PubKeyHash, PublicKey, TxBuilder, Value } from '@harmoniclabs/plu-ts';
import { tokenName } from '../../../app/constants';

test("Test - Only one NFT minted", async () => {
     
    const userAddress1 = await generateAccountSeedPhrase({lovelace : 20_000_000n});
    const userAddress2 = await generateAccountSeedPhrase({lovelace : 10_000_000n});
    const emulator = new Emulator([userAddress1,userAddress2]); 
      
    const lucid = await Lucid.new(emulator); 
    lucid.selectWalletFromSeed (userAddress1.seedPhrase);
    const tx = await lucid.newTx().payToAddress(userAddress1.address,{lovelace:10_000_000n}).complete();

    const signedTx = await tx.sign().complete(); 
    const txhash = await signedTx.submit();

    console.log ("Tx hash",txhash);

    emulator.awaitBlock(500);

    const utxos = await lucid.utxosAt(userAddress1.address);

    const plutusUtxos = lutxoToUTxO(utxos[0]);

    const ref = plutusUtxos.utxoRef.id; 
  
    const offChainTx = await getMintOneShotTx(new TxBuilder(defaultProtocolParameters),plutusUtxos,plutusUtxos.resolved.address);
  
    const feeOracleNftIdPolicyScript: SpendingValidator = {
        type: "PlutusV2",
        script: offChainTx.nftPolicySource.cbor.toString()//feeOracleNftPolicy.cbor.toString(),
    };
    
    const tobesignedTx = lucid.fromTx(offChainTx.tx.toCbor().toString());

    const signedLucidTx = await tobesignedTx.sign().complete();

    const txHash = await signedLucidTx.submit();

    //console.log (txhash);

    emulator.awaitBlock(50);

    const lucidUtxosAfterTx = await lucid.utxosAt(userAddress1.address);
    
    console.log("Txns after offchain code",lucidUtxosAfterTx);
    
    const plutusUtxosAfterTx = lutxoToUTxO(lucidUtxosAfterTx[1]);

    const qty = (valueToLAssets (plutusUtxosAfterTx.resolved.value)).quantity;

    expect(qty).resolves.toBe(1);
    
    console.log("Test passed");

  });

  // trying to fecth policy and token name

   /*  emulator.awaitBlock (50);
    
    const feeOracleNftPolicy = makeFeeOracleNftPolicy( PTxOutRef.fromData( pData( ref.toData() ) ) );

    const policy = feeOracleNftPolicy.hash;;

    //const name = tokenName.toString();

    //const unit = policy +name ;

    const utxostrail = lucid.utxosAtWithUnit(userAddress1.address,unit);

    const utxosWithFeeOraclNFT = getUtxoWithAssets(lucidUtxosAfterTx,{[unit]:1n}); */
    
   // Testing the feeoracle contract using the minted feeoracle nft -- but i couldnt get the unit out
    /* console.log("with 1 unit", utxostrail);

    const plutusUtxosFeeOracleNFT = lutxoToUTxO(utxosWithFeeOraclNFT);

    const paymentCredential = paymentCredentialOf(userAddress1.address)

    const offChainTxFeeOracle = await makeFeeOracleAndGetDeployTx(new TxBuilder(defaultProtocolParameters),plutusUtxosFeeOracleNFT
                                                            ,plutusUtxosFeeOracleNFT.resolved.address,new Hash28(feeOracleNftIdPolicyScript.script),
                                                            new PublicKey(paymentCredential.hash));

    const tobesignedFeeOracleTx = offChainTxFeeOracle.toCbor();

    const lucidFeeOracleTx = lucid.fromTx(tobesignedFeeOracleTx.toString());
                                                        
    const signedLucidFeeOracleTx = await lucidFeeOracleTx.sign().complete();
                                                        
    const txHashFeeOracle = await signedLucidFeeOracleTx.submit();

    emulator.awaitBlock(50);

    const lucidUtxosAfterFeeOracleTx = await lucid.utxosAt(userAddress1.address);
    
    console.log("Txns after offchain code",lucidUtxosAfterFeeOracleTx);
  //console.log("Utxos with 1 unit",utxos2);

    console.log("Test passed");

    

    }
    catch {
      Error();
    }
    //console.log("Test passed");

    }); 
  

 /*     //test("Test - Multiple NFTs minted", async () => {
  try{
      lucid.selectWalletFromSeed (userAddress2.seedPhrase);
      const tx = await lucid.newTx().payToAddress(userAddress2.address,{lovelace:5_000_000n}).complete();
  
      const signedTx = await tx.sign().complete(); 
      const txhash = await signedTx.submit();
  
      console.log (txhash);
  
      emulator.awaitBlock(50);
  
      const utxos = await lucid.utxosAt(userAddress2.address);
  
      const plutusUtxos = lutxoToUTxO(utxos[0]);
  
      const ref = plutusUtxos.utxoRef.id;

      const redeemer = () => Data.void();   

      const feeOracleNftPolicy = makeFeeOracleNftPolicy( PTxOutRef.fromData( pData( ref.toData() ) ) );
    
      const offChainTx = await getMintOneShotTx(new TxBuilder(defaultProtocolParameters),plutusUtxos,plutusUtxos.resolved.address);
    
      const feeOracleNftIdPolicyScript2: SpendingValidator = {
          type: "PlutusV2",
          script: offChainTx.nftPolicySource.cbor.toString()//feeOracleNftPolicy.cbor.toString(),
      };
  
      const tobesignedTx = offChainTx.tx.toCbor();
  
      const lucidTx = lucid.fromTx(tobesignedTx.toString());
  
      const signedLucidTx = await lucidTx.sign().complete();
  
      const txHash = await signedLucidTx.submit();
  
      console.log (txHash);
  
      emulator.awaitBlock(50);
  
      const lucidUtxosAfterTx = await lucid.utxosAt(userAddress1.address);
       
      const plutusUtxosAfterTx = lutxoToUTxO(lucidUtxosAfterTx[1]);
  
      const qty2 = (valueToLAssets (plutusUtxosAfterTx.resolved.value)).quantity;
  
      //expect(qty2).toBe(1);
  
      console.log("Test failed");
    }
    catch {
      console.log("Test failed");
    }
      //}); */ 