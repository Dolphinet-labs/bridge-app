import axios from "axios"


// bridge records 
// ?address=0x00&page=1&pageSize=50&order=desc
export function getBridgeRecords(page,pageSize,order,address,bridgeType) {
    return axios({
         
        url: "https://bridge-api.dolphinode.world/api/v1/bridge-records",
        method: "get",
        params: {
            page: page,
            pageSize: pageSize,
            order: order,
            address: address,
            bridgeType:bridgeType

        }
    })
}
// stake records 
