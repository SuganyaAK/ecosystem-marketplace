import { existsSync, readFileSync } from "fs";
import { mkdir } from "fs/promises";
import { isValidPath } from "../../utils/isValidPath";
import { MarketplaceConfig } from "../MarketplaceConfig";
import { isObject } from "@harmoniclabs/obj-utils";
import { cli } from "../../providers/cli";
import { Address, Hash28, PaymentCredentials } from "@harmoniclabs/plu-ts";
import { fromHex } from "@harmoniclabs/uint8array-utils";
import { getConfigPath } from "../getConfigPath";

export function tryGetValidMarketplaceConfig( path: string = getConfigPath() ): MarketplaceConfig
{
    if(!isValidPath( path )) throw new Error("invalid path for marketplace config");

    if( !existsSync( path ) )
    throw new Error(
        `couldn't find marketplace configuration file "${path}" from "${process.cwd()}"`
    );

    const cfg = {} as MarketplaceConfig;

    const json = JSON.parse( readFileSync( path, { encoding: "utf-8" } ) );
    
    if( !isObject( json ) )
    throw new Error("invalid JSON for markeptlace configuration");

    cfg.network = json.network;

    if(!(
        cfg.network === "mainnet" ||
        cfg.network === "preprod" ||
        cfg.network === "preview" ||
        cfg.network === "testnet"
    ))
    throw new Error("invalid network specified in config file; network was: " + cfg.network );

    if(!(
        typeof json.envFolderPath === "string" &&
        isValidPath( json.envFolderPath )
    ))
    {
        console.log("invalid 'envFolderPath' for markeptlace configuration; defaults to './testnet'");
        json.envFolderPath = "./testnet"
    }

    cfg.envFolderPath = json.envFolderPath + "/";

    if( !existsSync( cfg.envFolderPath ) )
    {
        mkdir( cfg.envFolderPath );
    }

    if(!(
        typeof json.ownerAddress === "string"
    ))
    throw new Error("invalid 'ownerAddress' for markeptlace configuration");

    cfg.ownerAddress = Address.fromString( json.ownerAddress );

    if( !isObject( json.signer ) )
    throw new Error("invalid 'signer' for markeptlace configuration");

    cfg.signer = {} as any;

    if( !isValidPath( json.signer.skeyPath ) )
    throw new Error("invalid 'signer.skeyPath' for markeptlace configuration");

    cfg.signer.skey = cli.utils.readPrivateKey( json.signer.skeyPath );

    cfg.signer.vkey = isValidPath( json.signer.vkeyPath ) ?
        cli.utils.readPublicKey( json.signer.vkeyPath ) :
        cfg.signer.skey.derivePublicKey();
    cfg.signer.address =
        // check if signer is also owner
        cfg.ownerAddress.paymentCreds.hash.toString() === cfg.signer.vkey.toString() ? cfg.ownerAddress :
        (
            // check if address (not owner) is specified and use that
            typeof json.signer.address === "string" ? Address.fromString( json.signer.address ) :
            // build default address
            new Address(
                cfg.ownerAddress.network,
                PaymentCredentials.pubKey( cfg.signer.vkey.hash )
            )
        );   
    if(!(
        isObject( json.paymentAsset ) &&
        typeof json.paymentAsset.policy === "string" &&
        typeof json.paymentAsset.tokenNameHex === "string"
    ))
    throw new Error("invalid 'paymentAsset' for markeptlace configuration");
    
    cfg.paymentAsset = {} as any;

    cfg.paymentAsset.policy = json.paymentAsset.policy === "" ? "" :
        new Hash28( json.paymentAsset.policy );
    cfg.paymentAsset.tokenName = fromHex( json.paymentAsset.tokenNameHex );

    if( cfg.paymentAsset.tokenName.length > 32 )
    throw new Error("invalid 'paymentAsset.tokenNameHex' for markeptlace configuration");

    if(!(
        typeof json.feeNumerator === "number" &&
        Number.isInteger( json.feeNumerator ) &&
        json.feeNumerator >= 0 &&
        json.feeNumerator <= 1_000_000
    ))
    json.feeNumerator = 25_000; // default

    cfg.feeNumerator = json.feeNumerator;

    cfg.blockfrostProjectId =
    ( typeof json.blockfrostProjectId === "string" ) ?
        json.blockfrostProjectId :
        undefined;

    return cfg;
    
}