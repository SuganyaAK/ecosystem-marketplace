import { PCurrencySymbol, POutputDatum, PPubKeyHash, PScriptContext, PTokenName, PTxOut, PTxOutRef, Script, Term, addUtilityForType, bool, compile, data, makeValidator, pIntToData, perror, pfn, pisEmpty, plet, pmatch, punBData, punIData } from "@harmoniclabs/plu-ts";
import { pvalueOf } from "../utils/pvalueOf";

export const feeOracle = pfn([
    PCurrencySymbol.type,   // fee oracle nft id
    PTokenName.type,    // fee oracle nft id
    PPubKeyHash.type,   // owner pub key hash
    data, // datum (int)
    data, // redeemer (int)
    PScriptContext.type
],  bool)
((
    nftSym,
    nftName,
    owner,
    feeNum, newFeeNumData, ctx
) => {

    const newFeeNum = plet( punIData.$( newFeeNumData ) );

    const getNftQty = plet( pvalueOf.$( nftSym ).$( nftName ) )

    const ownerSigned = ctx.tx.signatories.some( owner.peq );

    const ownInput = addUtilityForType( PTxOut.type )
    (
        plet(
            pmatch( ctx.purpose )
            .onSpending( ({ utxoRef }) => utxoRef )
            ._( _ => perror( PTxOutRef.type ) )
        ).in( ownRef =>
            pmatch(
                // find so we can have many inputs
                ctx.tx.inputs.find( ({ utxoRef }) => utxoRef.eq( ownRef ) )
            )
            .onNothing( _ => perror( PTxOut.type ) )
            .onJust(({ val }) => val.resolved )
        )
    )

    const validOwnInput = getNftQty.$( ownInput.value ).eq( 1 );

    const ownAddr = plet(
        ownInput.address
    );

    // const ownHash = plet(
    //     punBData.$(
    //         ownCreds.raw.fields.head
    //     )
    // );

    const ownOut = plet(
        pmatch(
            ctx.tx.outputs.find( out =>
                getNftQty.$( out.value ).eq( 1 )
            )
        )
        .onNothing( _ => perror( PTxOut.type ) )
        .onJust(({ val }) => val )
    );

    // nft stays here
    // audit 06
    const ownOutToSelf = ownOut.address.eq( ownAddr );

    const newFeeIsInRange = newFeeNum.gtEq( 0 ).and( newFeeNum.ltEq( 1_000_000 ) );

    const updatedFee = ownOut.datum.eq(
        POutputDatum.InlineDatum({
            datum: newFeeNumData
        })
    );

    return ownerSigned
    .and(  validOwnInput )
    .and(  ownOutToSelf )
    // prevent token dust attack (audit 07)
    .and(  pisEmpty.$( ownOut.value.tail.tail ) )
    .and(  newFeeIsInRange )
    .and(  updatedFee )
});

function makeUntypedFeeOracle(
    nftPolicy: Term<typeof PCurrencySymbol>,
    nftName:   Term<typeof PTokenName>,
    owner: Term<typeof PPubKeyHash>
)
{
    return makeValidator(
        feeOracle
        .$( nftPolicy )
        .$( nftName )
        .$( owner )
    );
};

export function makeFeeOracle(
    nftPolicy: Term<typeof PCurrencySymbol>,
    nftName:   Term<typeof PTokenName>,
    owner: Term<typeof PPubKeyHash>
)
{
    return new Script(
        "PlutusScriptV2",
        compile(
            makeUntypedFeeOracle(
                nftPolicy,
                nftName,
                owner
            )
        )
    );
}