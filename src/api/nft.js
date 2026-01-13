import axios from "axios"

export function getNfts(sourceChainId, destChainId) {
    return axios({

        url: "https://bridge-api.dolphinode.world/api/v1/nft-list",
        method: "get",
        params: {
            sourceChainId: sourceChainId,
            destChainId: destChainId,


        }
    })
}



export function getTokenIdList(chainId, address, owner) {
    return axios({

        url: "https://bridge-api.dolphinode.world/api/v1/nft-info",
        method: "get",
        params: {
            chainId: chainId,
            address: address,
            owner: owner


        }
    })
}


