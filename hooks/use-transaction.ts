//import { Lucid, } from "https://deno.land/x/lucid@0.10.4/mod.ts";
import { Lucid } from 'lucid-cardano';
import { Data, fromText } from "lucid-cardano";
import { useCallback, useEffect, useState } from 'react';


const useTransactionSender = (lucid?: Lucid) => {
  const [successMessage, setSuccessMessage] = useState<string>()
  const [error, setError] = useState<Error | undefined>()
  const [lovelace, setLovelace] = useState(0)
  const [toAccount, setToAccount] = useState("")

  useEffect(() => {
    if (!successMessage) return

    const timeout = setTimeout(() => setSuccessMessage(undefined), 5000)

    return () => clearTimeout(timeout)
  }, [successMessage])

  const sendTransaction = useCallback(async () => {
    if (!lucid || !toAccount || !lovelace) return
    const { paymentCredential } = lucid.utils.getAddressDetails(
      await lucid.wallet.address(),
    );

    const mintingPolicy = lucid.utils.nativeScriptFromJson(
      {
        type: "all",
        scripts: [
          { type: "sig", keyHash: paymentCredential.hash },
          {
            type: "before",
            slot: lucid.utils.unixTimeToSlot(Date.now() + 1000000),
          },
        ],
      },
    );

    const policyId = lucid.utils.mintingPolicyToId(mintingPolicy);
    const unit = policyId + fromText("EkivalTrans1token");
    const makerPkh: String = paymentCredential.hash;
    console.log("PKH : ", makerPkh);
    const totalamount = lovelace * 10;
    console.log("Amount : ", totalamount);
    //Create the Datum - à commenter si on n'envoit pas au smart contract;
    // Adresse Smart Contract Ekival: addr_test1wznm03079t5dr5xeetd4vjq2p3he6k5t4v898zmdxn0n8dq506hhn
    //Create the Datum;

    const Offer = Data.Object({
      maker: Data.Bytes(),
      taker: Data.Bytes(),
      amount: Data.Integer(),
      deposit: Data.Integer(),
      deadline: Data.Integer(),
      service: Data.Integer(),
      status: Data.Integer(),
    });
    type Offer = Data.Static<typeof Offer>;

    const offer = Data.to<Offer>(
      { maker: makerPkh, taker: "", amount: BigInt(totalamount), deposit: BigInt(lovelace), deadline: 1651025390000n, service: 1n, status: 0n },
      Offer,
    );
    // Fin du comment out si nécéssaire
    try {
      
      const tx = await lucid
        .newTx()
        .mintAssets({ [unit]: 1n })
        .validTo(Date.now() + 200000)
        .attachMintingPolicy(mintingPolicy)
        .payToContract(toAccount, { inline: offer }, { lovelace: BigInt(lovelace), [unit]: 1n })
        //.payToAddress(toAccount, { lovelace: BigInt(lovelace) })
        .complete()

      const signedTx = await tx.sign().complete()

      const txHash = await signedTx.submit()

      setLovelace(0)
      setToAccount("")
      setSuccessMessage(`Transaction submitted with hash ${txHash}`)
    } catch (e) {
      if (e instanceof Error) setError(e)
      else console.error(e)
    }
  }, [lucid, toAccount, lovelace])

  const lovelaceSetter = useCallback((value: string) => {
    setError(undefined)
    setSuccessMessage(undefined)

    const parsed = parseInt(value)
    if (isNaN(parsed)) return
    setLovelace(parsed)
  }, [])

  const toAccountSetter = useCallback((value: string) => {
    setError(undefined)
    setSuccessMessage(undefined)
    setToAccount(value)
  }, [])

  return {
    error,
    successMessage,
    lovelace,
    setLovelace: lovelaceSetter,
    toAccount,
    setToAccount: toAccountSetter,
    sendTransaction,
  }
}

export { useTransactionSender }
