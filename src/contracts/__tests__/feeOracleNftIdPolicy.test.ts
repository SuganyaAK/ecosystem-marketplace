import { getAddressUtxos, getTxUtxos, submitTx } from "@harmoniclabs/koios-pluts";
import { Address, Hash32, ITxOut, ITxOutRef, IUTxO, PTxOutRef, PaymentCredentials, PrivateKey, PubKeyHash, Tx, TxBuilder, TxOut, TxOutRef, UTxO, Value, defaultProtocolParameters, getTxInfos, pData } from "@harmoniclabs/plu-ts";
import { koios } from "../../../app/providers/koios"
import {makeFeeOracleNftPolicy} from "../feeOracleNftIdPolicy"
import script from "../../../testnet/fake.plutus.json"

async function main(){
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

    const tx1 =  txBuilder.buildSync({
        inputs: [
            {
                utxo: new UTxO({
                        utxoRef: {
                                id: "56".repeat(32),
                                index: 0
                                },
                        resolved: {
                                address: mockaddress,
                                value: Value.lovelaces( 10_000_000 )
                                }
                })
            }
                ],
        changeAddress: mockaddress
        });

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
                })
            

        tx1.signWith(pvrtkey);

        const hash = koios.tx.submit;

        console.log("Tx hash", hash.toString());

        const _tx = Tx.fromCbor((makeFeeOracleNftPolicy(PTxOutRef.fromData( pData( inputs1[0].utxoRef.toData())))).hash.toString());

        
        const tx = new Tx({
                ..._tx,
                body: {
                    ..._tx.body,
                inputs : [inputs1],
            
                },
            })

    
    
        const { v2: txInfoData } = getTxInfos( tx, undefined );

    }
main();
            