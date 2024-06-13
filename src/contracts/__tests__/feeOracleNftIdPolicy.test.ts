
import { Address, DataB, DataConstr, DataI, Hash32, ITxOut, ITxOutRef, IUTxO, Machine, PScriptContext, PTxOutRef, PaymentCredentials, PrivateKey, PubKeyHash, Tx, TxBuilder, TxOut, TxOutRef, UTxO, Value, defaultProtocolParameters, fromData, getTxInfos, pData } from "@harmoniclabs/plu-ts";
import { koios } from "../../../app/providers/koios"
import {feeOracleNftPolicy, makeFeeOracleNftPolicy} from "../feeOracleNftIdPolicy"


test("yey", () => {

    const txBuilder = new TxBuilder(
    defaultProtocolParameters);

    const pvrtkey = new PrivateKey("ff".repeat(32));
    const pubkey = pvrtkey.derivePublicKey();
    const pubkeyhash = pubkey.hash;

    const mockaddress = (new Address(
                            "testnet",
                            new PaymentCredentials(
                            "pubKey",
                            pubkeyhash.clone()
                            )
                            )).toJson();

    console.log("Mock Address:",mockaddress);

    const inputs1: UTxO = 
            new UTxO({
                        utxoRef: {
                                id: "56".repeat(32),
                                index: 0
                                },
                        resolved: {
                                address: mockaddress,
                                value: Value.lovelaces( 10_000_000 )
                                }
            });

    const tx1 =  txBuilder.buildSync({
        inputs : [{
            utxo : inputs1
        }],
        changeAddress: mockaddress
        });
        
            
        const { v2: txInfoData } = getTxInfos( tx1, undefined );

        const policyid = makeFeeOracleNftPolicy(PTxOutRef .fromData(pData(inputs1.toData()))).hash.toString();
        const purposeData = new DataConstr(
            0,
            [
                new DataConstr(
                    0,
                    [
                        new DataB(policyid)
                       // new DataI(0)
                    ]
                )
            ]
        );

        const ctxData = new DataConstr(
            0,
            [
                txInfoData,
                purposeData      
            ]
        );
        const redeemerData = new DataConstr( 0, [] );

        const evalResult = Machine.evalSimple(
            feeOracleNftPolicy
            .$( PTxOutRef.fromData( pData( txInfoData) ) )
            .$( pData(redeemerData )) 
            .$( PScriptContext.fromData( pData( ctxData ) ) )
        );
    
        console.log( evalResult );

    }
);
            
