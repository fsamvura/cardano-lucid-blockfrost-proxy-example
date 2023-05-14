import { isNil } from "lodash"
import { Blockfrost, Lucid } from "lucid-cardano"
import { useCallback, useEffect, useState } from "react"

import { useNetworkId } from "./use-network-id"
import { useWalletApi } from "./use-wallet-api"

const useLucid = () => {
  const [lucid_a, setLucid] = useState<Lucid>()
  const walletApi = useWalletApi()
  const networkId = useNetworkId(walletApi)

  const initializeLucid = useCallback(async () => {
    if (isNil(networkId) || isNil(walletApi)) return

    const provider = new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprod6b8gtgiQPnZV4UgkfeflhfirEmZZi86E")
    const network = networkId === 0 ? "Preprod" : "Mainnet"

    const updatedLucid = await (isNil(lucid_a)
      ? Lucid.new(provider, network)
      : lucid_a.switchProvider(provider, network))

    const lucidWithWallet = updatedLucid.selectWallet(walletApi)

    setLucid(lucidWithWallet)
  }, [lucid_a, networkId, walletApi])

  useEffect(() => {
    initializeLucid()
  }, [initializeLucid])

  return {
    networkId,
    walletApi,
    lucid_a,
  }
}

export { useLucid }
