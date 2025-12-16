import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

// networkEnv: 'testnet' | 'mainnet'
const STORAGE_KEY = 'bridge-env'

export const useEnvStore = defineStore('env', () => {
  const networkEnv = ref('testnet')

  // init from localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'mainnet' || saved === 'testnet') networkEnv.value = saved
  } catch {
    // ignore
  }

  const isMainnet = computed(() => networkEnv.value === 'mainnet')
  const dolphinetChainId = computed(() => (isMainnet.value ? 1520 : 1519))

  function setEnv(env) {
    if (env !== 'mainnet' && env !== 'testnet') return
    networkEnv.value = env
  }

  function toggleEnv() {
    networkEnv.value = isMainnet.value ? 'testnet' : 'mainnet'
  }

  watch(networkEnv, (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, v)
    } catch {
      // ignore
    }
  })

  return { networkEnv, isMainnet, dolphinetChainId, setEnv, toggleEnv }
})


