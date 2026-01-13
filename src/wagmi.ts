import { http, createConfig, createStorage } from '@wagmi/vue'
import { walletConnect, injected } from '@wagmi/vue/connectors'
import { defineChain } from 'viem'
// 导入官方链定义，省去手动配置 blockExplorers 等信息
import { mainnet, optimism, polygon, bsc } from '@wagmi/vue/chains'

// 1. 自定义 Dolphinet 主网 (因为它不在官方库中，保留手动定义)
const dolphinet = defineChain({
  id: 1520,
  name: 'Dolphinet',
  nativeCurrency: {
    name: 'Dolphinet',
    symbol: 'DOL',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.dolphinode.world'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Dolphinet Explorer',
      url: 'https://explorer.dolphinode.world',
    },
  },
})

// 2. 配置 Wagmi
export const config = createConfig({
  // 将 dolphinet 放在第一位，作为默认连接的链
  chains: [dolphinet, mainnet, optimism, polygon, bsc],

  connectors: [
    injected(),
    walletConnect({
      projectId: 'f87cf4373910e1766c873dc5df019573',
    }),
  ],

  storage: createStorage({
    storage: localStorage,
    key: 'dol'
  }),

  // 3. 关键点：在这里强制指定你提供的 RPC 地址
  transports: {
    [dolphinet.id]: http('https://rpc.dolphinode.world'),
    [mainnet.id]: http('https://mainnet.infura.io/v3/10e3a11b64a748599fef8e9807028d92'),
    [optimism.id]: http('https://optimism-mainnet.infura.io/v3/10e3a11b64a748599fef8e9807028d92'),
    [polygon.id]: http('https://polygon-mainnet.infura.io/v3/10e3a11b64a748599fef8e9807028d92'),
    [bsc.id]: http('https://bsc-mainnet.infura.io/v3/10e3a11b64a748599fef8e9807028d92'),
  },
})

// 4. 类型注入（Vue 环境必需）
declare module '@wagmi/vue' {
  interface Register {
    config: typeof config
  }
}