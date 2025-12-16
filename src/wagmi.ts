import { http, createConfig, createStorage } from '@wagmi/vue'
import { walletConnect, injected } from '@wagmi/vue/connectors'
import { defineChain } from 'viem'

// ✅ 1. 定义各链
const dolphinetTestnet = defineChain({
  id: 1519,
  name: 'Dolphinet Testnet',
  nativeCurrency: { name: 'Dolphinet', symbol: 'DOL', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc-testnet.dolphinode.world'],
      webSocket: ['wss://wss-testnet.dolphinode.world']
    }
  },
  blockExplorers: {
    default: {
      name: 'Dolphinet Explorer',
      url: 'https://explorer-testnet.dolphinode.world',
    },
  },
  testnet: true,
})

const dolphinetMainnet = defineChain({
  id: 1520,
  name: 'Dolphinet Mainnet',
  nativeCurrency: { name: 'Dolphinet', symbol: 'DOL', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.dolphinode.world', 'https://rpc-dev01.dolphinode.world'],
      webSocket: ['wss://wss.dolphinode.world', 'wss://wss-dev01.dolphinode.world']
    }
  },
  blockExplorers: {
    default: {
      name: 'Dolphinet Explorer',
      url: 'https://explorer.dolphinode.world',
    },
  },
  testnet: false,
})

const sepolia = defineChain({
  id: 11155111,
  name: 'Sepolia Testnet',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://eth-sepolia.g.alchemy.com/v2/afSCtxPWD3NE5vSjJm2GQ'] } },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
})

const optimism = defineChain({
  id: 11155420,
  name: 'Optimism Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://opt-sepolia.g.alchemy.com/v2/afSCtxPWD3NE5vSjJm2GQ'] } },
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
  chains: [dolphinetTestnet, dolphinetMainnet, sepolia, optimism],
  connectors: [
    injected(), // ✅ 添加 injected 连接器支持 MetaMask 等浏览器钱包
    walletConnect({
      projectId: 'f87cf4373910e1766c873dc5df019573',
    }),
  ],
  storage: createStorage({ storage: localStorage, key: 'vite-vue' }),
  transports: {
    [dolphinetTestnet.id]: http(dolphinetTestnet.rpcUrls.default.http[0]),
    [dolphinetMainnet.id]: http(dolphinetMainnet.rpcUrls.default.http[0]),
    [sepolia.id]: http(sepolia.rpcUrls.default.http[0]),
    [optimism.id]: http(optimism.rpcUrls.default.http[0])
  },
})

// ✅ 3. 类型注入
declare module '@wagmi/vue' {
  interface Register {
    config: typeof config
  }
}