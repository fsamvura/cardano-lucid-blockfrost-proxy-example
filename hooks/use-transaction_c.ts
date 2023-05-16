//import { Lucid, } from "https://deno.land/x/lucid@0.10.4/mod.ts";
import { Lucid } from 'lucid-cardano';
import { Data, fromText, Blockfrost, Address } from "lucid-cardano";
import { useCallback, useEffect, useState } from 'react';


const useTransactionSender = (lucid_a?: Lucid) => {
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
    const lucid_b = await Lucid.new(
      new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprod6b8gtgiQPnZV4UgkfeflhfirEmZZi86E"),  // project-id header will be set by redirect
      "Preprod"
    );
    lucid_b.selectWalletFromSeed("shoot wood unlock range twelve sentence dolphin axis wasp property outer coil bless roof surge intact wild market silly month educate power neglect warfare");
    const addr_b: Address = await lucid_b.wallet.address();
    
    if (!lucid_b || !toAccount || !lovelace) return
    const { paymentCredential } = lucid_b.utils.getAddressDetails(
      await lucid_b.wallet.address(),
    );
    const addr_a: Address = await lucid_a.wallet.address();
    const mintingPolicy = lucid_b.utils.nativeScriptFromJson(
      {
        type: "all",
        scripts: [
          { type: "sig", keyHash: paymentCredential.hash },
          {
            type: "before",
            slot: lucid_b.utils.unixTimeToSlot(Date.now() + 1000000),
          },
        ],
      },
    );

    const policyId = lucid_b.utils.mintingPolicyToId(mintingPolicy);
    const unit = policyId + fromText("EkivalTrans1token");
    const makerPkh: String = paymentCredential.hash;
    console.log("PKH : ", makerPkh);
    const totalamount = lovelace * 10;
    console.log("Amount : ", totalamount);
    console.log("Dapp Address", addr_b);
    console.log("signee Address", addr_a);
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
      
      const tx_a = lucid_b
        .newTx()
        .mintAssets({ [unit]: 1n })
        .validTo(Date.now() + 200000)
        .attachMintingPolicy(mintingPolicy)
        .payToContract(toAccount, { inline: offer }, { lovelace: BigInt(lovelace), [unit]: 1n })
        //.payToAddress(addr_a, { [unit]: 1n })
        .addSigner(addr_b)

      //const signedTx_a = tx_a.partialSign();
      //console.log("Signature", signedTx_a)
      const tx = await lucid_a.newTx()
        .compose(tx_a)
        .payToContract(toAccount, { inline: offer }, { lovelace: BigInt(lovelace) })
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
  }, [lucid_a, toAccount, lovelace])

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
