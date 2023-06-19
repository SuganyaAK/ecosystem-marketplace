import { PScriptContext, PTxOutRef, Script, Term, bool, bs, compile, data, makeRedeemerValidator, perror, pfn, pisEmpty, plet, pmatch } from "@harmoniclabs/plu-ts";

/**
 * standard one-shot policy
**/
export const feeOracleNftIdPolicy = pfn([
    PTxOutRef.type,
    data,
    PScriptContext.type
],  bool)
( (mustSpend, _rdmr, ctx ) => {

    const utxoSpent = ctx.tx.inputs.some( ({ utxoRef }) => utxoRef.eq( mustSpend ) );

    const ownHash = plet(
        pmatch( ctx.purpose )
        .onMinting( ({ currencySym }) => currencySym )
        ._( _ => perror( bs ) )
    );

    const onlyOneMinted = ctx.tx.mint.some(({ fst: policy, snd: assets }) =>
        policy.eq( ownHash )
        .and(
            pisEmpty.$( assets.tail ) // single asset minted
        )
        .and(
            assets.head.snd // amount
            .eq( 1 )
        )
    );

    /* If needed add `isBurning.or` before parentesis to always allow burning
    const isBurning = ctx.tx.mint.some(({ fst: policy, snd: assets }) =>
        policy.eq( ownHash )
        .and(
            assets.every(({ snd: quantity }) => quantity.lt( 0 ) )
        )
    );
    */

    return (
        utxoSpent.and( onlyOneMinted )
    );
});

function makeUntypedFeeOracleNftIdPolicy( utxo: Term<typeof PTxOutRef> )
{
    return makeRedeemerValidator(
        feeOracleNftIdPolicy.$( utxo )
    )
};

export function makeFeeOracleNftIdPolicy( utxo: Term<typeof PTxOutRef> )
{
    return new Script(
        "PlutusScriptV2",
        compile( makeUntypedFeeOracleNftIdPolicy( utxo ) )
    );
}