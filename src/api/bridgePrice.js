// import request from '@/utils/request'


import axios from "axios"

export function getbridgeFees(
    chain_id,
    symbol
) {
    return axios({
        url: "https://bridge-api-testnet.cpchain.com/api/v1/bridge-price-fee",
        method: "get",
        params: {
            chain_id,
            symbol
        }
    })
}