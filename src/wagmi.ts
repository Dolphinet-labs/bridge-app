import { http, createConfig, createStorage } from '@wagmi/vue'
import { walletConnect, injected } from '@wagmi/vue/connectors'
import { defineChain } from 'viem'

// ✅ 1. 定义各链
const doplhinet = defineChain({
  id: 1519,
  name: 'doplhinet Testnet',
  nativeCurrency: { name: 'doplhinet', symbol: 'DOL', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc-testnet.dolphinode.world'] } },
  blockExplorers: {
    default: {
      name: 'doplhinet Explorer',
      url: 'https://explorer-testnet.dolphinode.world',
    },
  },
  testnet: true,
})


const optimism = defineChain({
  id: 11155420,
  name: 'Optimism Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://optimism-sepolia.infura.io/v3/10e3a11b64a748599fef8e9807028d92'] } },
  blockExplorers: {
    default: {
      name: 'OP Explorer',
      url: 'https://sepolia-optimism.etherscan.io',
    },
  },
  testnet: true,
})

// ✅ 2. 构建 wagmi config
export const config = createConfig({
  chains: [doplhinet,  optimism],
  connectors: [
    injected(), // ✅ 添加 injected 连接器支持 MetaMask 等浏览器钱包
    walletConnect({
      projectId: 'f87cf4373910e1766c873dc5df019573',
    }),
  ],
  storage: createStorage({ storage: localStorage, key: 'vite-vue' }),
  transports: {
    [doplhinet.id]: http(doplhinet.rpcUrls.default.http[0]),
     [optimism.id]: http(optimism.rpcUrls.default.http[0])
  },
})

// ✅ 3. 类型注入
declare module '@wagmi/vue' {
  interface Register {
    config: typeof config
  }
}