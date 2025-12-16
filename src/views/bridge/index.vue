<template>
  <div class="bridge">

    <div class="swap-container" v-if="bridgeStep === 1">
      <div class="bridge-mode-tabs">
        <button
          class="mode-btn"
          :class="{ active: bridgeMode === 'token' }"
          @click="bridgeMode = 'token'"
        >
          {{ $t('bridge.mode.token') }}
        </button>
        <button
          class="mode-btn"
          :class="{ active: bridgeMode === 'nft' }"
          @click="bridgeMode = 'nft'"
        >
          {{ $t('bridge.mode.nft') }}
        </button>
      </div>

      <h1>
        <span class="title-part1">The Ocean of</span>
        <span class="title-part2">Interoperability</span>
      </h1>
      <div class="content">
        <div class="item">
          <div class="chain-card left" @click="showChain(1)">
            <div>
              <img :src="getImageUrl(fromChain.img)" alt="">
            </div>
            <div>
              <div class="label" style="text-align: left;"> {{ $t('bridge.from') }}</div>
              <div class="name">{{ fromChain.name }}</div>
            </div>
          </div>
          <div class="arrow-wrap" @click="switchChains()">
            <span class="arrow">→</span>
          </div>
          <div class="chain-card right" @click="showChain(2)">

            <div>
              <div class="label" style="text-align: right;">{{ $t('bridge.to') }}</div>
              <div class="name">{{ toChain.name }}</div>
            </div>
            <div>
              <img :src="getImageUrl(toChain.img)" alt="">
            </div>
          </div>
        </div>

        <div class="amount-card" v-if="bridgeMode === 'token'">
          <!-- 左侧 -->
          <div class="amount-main">
            <div class="amount-value">
              <input type="number" :disabled="!address" :placeholder="$t('bridge.placeholderAmount')"
                v-model.trim="amount" @input="validateAndCorrectAmount" @blur="validateAndCorrectAmount" step="any"
                min="0.1" />

            </div>

          </div>
          <!-- 右侧 -->
          <div class="amount-side">
            <div class="token-selector" @click="showCoin()">

              <img :src="getImageUrl_1(coinChoose.img)" class="token-icon" />
              <span>{{ coinChoose.name }}</span>
              <svg class="arrow" width="16" height="16" viewBox="0 0 20 20">
                <path d="M6 8l4 4 4-4" stroke="#aaa" stroke-width="2" fill="none" stroke-linecap="round" />
              </svg>
            </div>
            <div class="amount-avail">{{ $t('bridge.Available') }}
              <img src="@/assets/images/bridge/loading-gray.svg" v-if="isLoadingBalance" alt="">
              <span v-else>
                &nbsp;{{ fromBalance }}{{ coinChoose.name }}
              </span>

            </div>
          </div>
        </div>

        <!-- NFT 模式表单 -->
        <div class="nft-card" v-if="bridgeMode === 'nft'">
          <div class="nft-row">
            <div class="nft-label">{{ $t('bridge.nft.localCollection') }}</div>
            <input class="nft-input" v-model.trim="nftLocalCollection" :placeholder="$t('bridge.nft.inputAddress')" />
          </div>
          <div class="nft-row">
            <div class="nft-label">{{ $t('bridge.nft.remoteCollection') }}</div>
            <input class="nft-input" v-model.trim="nftRemoteCollection" :placeholder="$t('bridge.nft.inputAddress')" />
          </div>
          <div class="nft-row">
            <div class="nft-label">{{ $t('bridge.nft.tokenId') }}</div>
            <div class="nft-tokenid-wrap">
              <div class="nft-tokenid-actions">
                <button class="nft-mini-btn" type="button" @click="refreshOwnedNfts" :disabled="isLoadingNftList">
                  {{ isLoadingNftList ? $t('bridge.nft.loading') : $t('bridge.nft.refresh') }}
                </button>
                <button class="nft-mini-btn" type="button" @click="toggleTokenIdMode">
                  {{ nftTokenIdMode === 'list' ? $t('bridge.nft.manualInput') : $t('bridge.nft.useList') }}
                </button>
              </div>

              <div v-if="nftListError" class="nft-hint error">{{ nftListError }}</div>
              <div v-else-if="nftTokenIdMode === 'list' && nftOwnedTokenIds.length" class="nft-hint">
                {{ $t('bridge.nft.myNfts') }}：{{ nftOwnedTokenIds.length }}
              </div>

              <select
                v-if="nftTokenIdMode === 'list' && nftOwnedTokenIds.length"
                class="nft-select"
                v-model="nftSelectedTokenId"
              >
                <option value="" disabled>{{ $t('bridge.nft.chooseTokenId') }}</option>
                <option v-for="id in nftOwnedTokenIds" :key="id" :value="id">{{ id }}</option>
              </select>

              <input
                v-else
                class="nft-input"
                type="number"
                v-model.trim="nftTokenId"
                placeholder="0"
              />
            </div>
          </div>
          <div class="nft-row">
            <div class="nft-label">{{ $t('bridge.nft.to') }}</div>
            <input class="nft-input" v-model.trim="nftToAddress" :placeholder="$t('bridge.nft.toPlaceholder')" />
          </div>
          <div class="nft-fee">
            {{ $t('bridge.nft.fee') }}：
            <img v-if="isLoadingNftFee" src="@/assets/images/bridge/loading-gray.svg" alt="" />
            <span v-else>{{ nftFeeDisplay }}</span>
          </div>
        </div>

        <div class="summary-card" v-if="bridgeMode === 'token'">
          <div class="summary-main">
            <img class="summary-icon" :src="getImageUrl_1(coinChoose.img)" alt="ETH" />
            <div class="summary-info">
              <div class="summary-amt">{{ bridgeAmount }}{{ coinChoose.name }}</div>

            </div>
          </div>
          <div class="summary-bottom">
            <div class="summary-fee">{{ $t('bridge.handlingfee') }}

              <img v-if="isloadingGas" src="@/assets/images/bridge/loading-gray.svg" alt="">
              <span v-else> ${{ allusdtFees }}({{ allbridgeFees }}{{ coinChoose.name }})</span>
            </div>
            <div class="summary-time">
              {{ $t('bridge.transferTime') }}
              <svg width="12" height="12" class="clock" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" stroke="#a0a0a0" stroke-width="1.5" fill="none" />
                <line x1="10" y1="10" x2="10" y2="6" stroke="#a0a0a0" stroke-width="1.2" stroke-linecap="round" />
                <line x1="10" y1="10" x2="13.3" y2="12.1" stroke="#a0a0a0" stroke-width="1.2" stroke-linecap="round" />
              </svg>
            </div>
          </div>

        </div>
        <div id="gascontainer">

        </div>
        <!-- <button class="submit-btn" :disabled="!isInsufficient" @click="tab(2)">
          <span v-if="!isInsufficient"> {{ $t('bridge.Insufficient') }} </span>
          <span v-else>{{ $t('bridge.Crosschain') }}</span>
        </button> -->
        <button
          class="submit-btn"
          v-if="bridgeMode === 'token'"
          :disabled="address && (!amount || !isInsufficient)"
          @click="handleSubmitClick"
        >
          <span v-if="!address">{{ $t('bridge.connectWallet') }}</span>
          <span v-else-if="!amount">{{ $t('bridge.enterValidAmount') }}</span>
          <span v-else-if="!isInsufficient">{{ $t('bridge.Insufficient') }}</span>
          <span v-else>{{ $t('bridge.Crosschain') }}</span>
        </button>

        <button
          class="submit-btn"
          v-else
          :disabled="!canSubmitNft"
          @click="handleSubmitNft"
        >
          <span v-if="!address">{{ $t('bridge.connectWallet') }}</span>
          <span v-else>{{ $t('bridge.nft.crosschain') }}</span>
        </button>
      </div>
    </div>


    <div class="confirm-modal" v-if="bridgeStep === 2">
      <!-- 顶部标题与关闭 -->
      <div class="modal-header">
        <el-icon style="color: #1a1a1a;cursor: pointer;" @click="tab(1)">
          <Back />
        </el-icon>
        <!-- <i class="el-icon-back" style="color: #fff;cursor: pointer;" @click="tab(1)"></i> -->
        <span class="modal-title"> {{ $t('bridge.sureTitle') }}</span>
        <span class="close-btn" @click="tab(1)">×</span>
      </div>
      <!-- 资产1 -->
      <div class="modal-block">
        <div class="block-row">
          <div class="block-chain">
            <img :src="getImageUrl(fromChain.img)" class="block-icon" alt="">
            <span class="block-label">{{ $t('bridge.from') }}&nbsp;{{ fromChain.name }}&nbsp;{{ $t('bridge.Crosschain')
            }}</span>
          </div>
          <span class="block-addr"> {{ ellipsisFilter(address) }}</span>
        </div>
        <div class="block-amount">
          <img :src="getImageUrl_1(coinChoose.img)" class="amount-icon" alt="">
          <span class="amount-value">{{ amount }} {{ coinChoose.name }}</span>
        </div>
      </div>
      <!-- 资产2 -->
      <div class="modal-block">
        <div class="block-row">
          <div class="block-chain">
            <img class="block-icon" :src="getImageUrl(toChain.img)" alt="">
            <span class="block-label">{{ toChain.name }}{{ $t('bridge.get') }}</span>
          </div>
          <span class="block-addr"> {{ ellipsisFilter(address) }}</span>
        </div>
        <div class="block-amount">
          <img :src="getImageUrl_1(coinChoose.img)" class="amount-icon" alt="">
          <span class="amount-value">{{ bridgeAmount }} {{ coinChoose.name }}</span>
        </div>
      </div>
      <!-- 信息明细 -->
      <div class="modal-info">
        <div class="info-row">
          <span class="info-label">{{ $t('bridge.cross') }}</span>
          <span class="info-value">{{ $t('bridge.crossName') }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ $t('bridge.time') }}</span>
          <span class="info-value">{{ $t('bridge.transferTime') }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ $t('bridge.fee') }}</span>
          <span class="info-value">${{ allusdtFees }}({{ allbridgeFees }}{{ coinChoose.name }})</span>
        </div>
      </div>
      <!-- 底部按钮 222-->
      <button class="modal-btn" :disabled="isProcessing" @click="bridgeMethod">
        <img src="@/assets/images/bridge/loading.svg" v-if="isProcessing" alt="">
        <span v-else>{{ $t('bridge.continues') }}</span>
      </button>
    </div>


    <!--  选择链弹窗 -->
    <div class="chain-select-modal" v-if="showModal">
      <div class="chain-select-content">
        <div class="header">
          <span>{{ $t('bridge.selChain') }}</span>
          <span class="close-btn" @click="handleClose">✕</span>
        </div>
        <div class="search-box">
          <input v-model="search" type="text" :placeholder="$t('bridge.search')" @input="fliterChain()" />
        </div>

        <div class="chain-list">
          <div v-for="chain in chains" :key="chain.id" class="chain-item" :class="{ active: chain.name === selected }"
            @click="select(chain)">

            <img :src="getImageUrl(chain.img)" alt="" class="chain-icon">
            <span class="chain-name">{{ chain.name }}</span>
            <span v-if="chain.chainId === selected.chainId" class="check-mark">✔</span>
          </div>
        </div>
      </div>
    </div>
    <!--  选择币 -->


    <div class="chain-select-modal" v-if="showModal2">
      <div class="chain-select-content">
        <div class="header">
          <span>{{ $t('bridge.selIcon') }}</span>
          <span class="close-btn" @click="showModal2 = false">✕</span>
        </div>
        <div class="search-box">
          <input v-model="search2" type="text" :placeholder="$t('bridge.search')" @input="fliterCoin()" />
        </div>

        <div class="chain-list">
          <div v-for="coin in allCoinList" :key="coin.name" class="chain-item"
            :class="{ active: coin.name === coinChoose.name }" @click="select2(coin)">
            <img :src="getImageUrl_1(coin.img)" alt="" class="chain-icon">


            <span class="chain-name">{{ coin.name }}</span>
            <span v-if="coin.name === coinChoose.name" class="check-mark">✔</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 历史记录  -->
    <div class="recordList">
      <div class="records-title">{{ $t('bridge.record.title') }}</div>
      <div v-if="records.length > 0">
        <table cellpadding="0" cellspacing="0">
          <thead>
            <tr>
              <th>{{ $t('bridge.record.sourcehash') }}</th>
              <th>{{ $t('bridge.record.tosourcehash') }}</th>
              <th>{{ $t('bridge.record.name1') }}</th>
              <th>{{ $t('bridge.record.coin') }}</th>
              <th>{{ $t('bridge.record.fee') }}</th>
              <th>{{ $t('bridge.record.total') }}</th>
              <th>{{ $t('bridge.record.send') }}</th>

              <th>{{ $t('bridge.record.receive') }}</th>
              <th>{{ $t('bridge.record.state.name') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in records" :key="idx" :class="{ 'alt': idx % 2 === 0 }">
              <td class="goScan" @click="gotoScan('tx', row.source_tx_hash, row.source_chain_id)">{{
                shortAddress(row.source_tx_hash) }}</td>
              <td class="goScan" @click="gotoScan('tx', row.dest_tx_hash, row.dest_chain_id)">{{
                shortAddress(row.dest_tx_hash) }}</td>
              <td>{{ formatTimestamp(row.msg_sent_timestamp) }}</td>
              <td>{{ row.token_name }}</td>
              <td>{{ formatToken(row.fee, row.token_name) }}</td>

              <td>{{
                formatToken(row.amount, row.token_name)
              }}</td>
              <td>{{ shortAddress(row.from_address) }}</td>
              <td>{{ shortAddress(row.to_address) }}</td>
              <td>
                <span :class="['status', row.status === 1 ? 'success' : 'fail']">
                  {{ row.status === 1 ? $t('bridge.record.state.success') :
                    $t('bridge.record.state.ped') }}
                </span>
              </td>
            </tr>
          </tbody>

        </table>



        <ul>
          <li v-for="(row, idx) in records" :key="idx">
            <div class="item">
              <b class="name">{{ row.token_name }}</b>
              <span class="see" @click="gotoScan('tx', row.source_tx_hash, row.source_chain_id)">{{
                $t('bridge.record.opt')
              }}</span>
            </div>
            <div class="item">
              <b class="sendName">{{ $t('bridge.record.total') }}</b>
              <span class="see">
                {{ formatToken(row.amount, row.token_name) }}
              </span>
            </div>
            <div class="item">
              <b class="sendName">{{ $t('bridge.record.fee') }}</b>
              <span class="see">
                {{ formatToken(row.fee, row.token_name) }}
              </span>
            </div>
            <div class="item">
              <b class="sendName">{{ $t('bridge.record.sourcehash') }}</b>
              <span class="see" @click="gotoScan('tx', row.source_tx_hash, row.source_chain_id)">{{
                shortAddress(row.source_tx_hash) }}</span>
            </div>
            <div class="item">
              <b class="receiveName">{{ $t('bridge.record.tosourcehash') }}</b>
              <span class="see" @click="gotoScan('tx', row.dest_tx_hash, row.dest_chain_id)">{{
                shortAddress(row.dest_tx_hash) }}</span>
            </div>

            <div class="item">
              <b class="statues">{{ $t('bridge.record.state.name') }}</b>
              <span :class="['status', row.status === 1 ? 'success' : 'fail']">
                {{ row.status === 1 ? $t('bridge.record.state.success') :
                  $t('bridge.record.state.ped') }}
              </span>
            </div>

            <div class="item">
              <b class="time">{{ $t('bridge.record.name1') }}</b>
              <span class="see">
                {{ formatTimestamp(row.msg_sent_timestamp) }}
              </span>
            </div>
          </li>
        </ul>
        <div class="pagination">
          <el-pagination layout="prev, pager, next" :total="Total" :current-page.sync="pageNumber" :page-size="pageSize"
            @current-change="handleCurrentChange">
          </el-pagination>
        </div>
      </div>

    </div>
  </div>
</template>
<script setup>
import {
  ethers, Network, JsonRpcProvider, formatUnits,
} from 'ethers';
import { ref, onMounted, watch, computed, onUnmounted } from "vue"
import erc20ABI from "@/assets/abi/erc20ABI"
import bridge from "@/assets/abi/bridgeABI"
const bridgeABI = bridge.abi
import { parseEther } from 'viem'
import BigNumber from 'bignumber.js';
import networks from "../../assets/json/networks.json"
import { getbridgeFees } from "@/api/bridgePrice"
import { getBridgeRecords } from "@/api/records.js"
// 在 <script setup> 部分的导入区域添加
import { ElMessage } from 'element-plus'
console.log(networks)
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

// 拿到 store
const counterStore = useCounterStore()
const { visible, isLogin } = storeToRefs(counterStore)
// 翻译消息常量 - 保持原有的结构，只是扩展内容
const BRIDGE_MESSAGES = computed(() => ({
  userCancelledAuth: t('bridge.userCancelledAuth'),
  approveTokenFailed: t('bridge.approveTokenFailed'),
  approvalPending: t('bridge.approvalPending'),
  approvalConfirmed: t('bridge.approvalConfirmed'),
  approvalFailed: t('bridge.approvalFailed'),
  bridgePending: t('bridge.bridgePending'),
  bridgeConfirmed: t('bridge.bridgeConfirmed'),
  bridgeFailed: t('bridge.bridgeFailed'),
  insufficientBalance: t('bridge.insufficientBalance'),
  invalidAmount: t('bridge.invalidAmountFormat'),
  networkMismatch: t('bridge.networkSwitchFailed'),
  userRejected: t('bridge.userRejected'),
  unknownError: t('bridge.unknownError'),
  approvalSuccess: t('bridge.approvalSuccess'),
  bridgeSuccess: t('bridge.bridgeSuccess'),
  bridgeFailed: t('bridge.bridgeFailed')
}))

// UI 消息常量
const UI_MESSAGES = computed(() => ({
  connectWallet: t('bridge.connectWallet'),
  enterValidAmount: t('bridge.enterValidAmount'),
  minimumAmount: t('bridge.minimumBridgeAmount'),
  insufficientBalance: t('bridge.insufficientBalance'),
  switchNetwork: t('bridge.switchToCorrectNetwork'),
  fundsArrived: t('bridge.fundsArrive'),
  historyAdded: t('bridge.historyAdded')
}))
let ws = "";
const coinList = [
  {
    img: "eth.svg",
    name: "ETH",
    minBridgeAmount: 0.1
  }, {
    img: "usdt.png",
    name: "USDT",
    minBridgeAmount: 0.1
  },
  {
    img: "cp.svg",
    name: "DOL",
    minBridgeAmount: 0.1
  },



]

const TOKEN_DECIMALS = {
  ETH: 18,
  USDT: 18,
  USDC: 18,
  DAI: 18,
  WBTC: 8,
  DOL: 18
};

import { switchChain } from '@wagmi/core'
import { readContract } from '@wagmi/core'
import {
  useChainId, useConnect, useDisconnect, useAccount, useAccountEffect, useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt
} from '@wagmi/vue'

const { connect, connectors, error } = useConnect();
const { address, status, chain } = useAccount()
import { config } from '../../wagmi.ts' // 确保路径正确

// 在 script setup 的导入部分添加
import { bridgeMethodOptimized } from './bridgeCore.js'
import { bridgeNftOptimized } from './bridgeCore.js'
import erc721 from "@/assets/abi/erc721ABI.json"
const erc721ABI = erc721.abi
const pageNumber = ref(1)

const pageSize = ref(5)
const Total = ref(0)
const isloadingGas = ref(false)
const records = ref([])

const allusdtFees = ref(0)
const allbridgeFees = ref(0)
const showModal = ref(false)
const showModal2 = ref(false)
const selected = ref("cp")
const search = ref("")
const search2 = ref("")
const chains = ref(networks)
const fromBalance = ref(0)
const toBalance = ref(0)
const fromChain = ref(networks[0])
const toChain = ref(networks[1])
const state = ref()


const bridgeFee = ref(0.0001)
const amount = ref(null)

const bridgeAmount = ref() // bridge after amount

const dialogVisible = ref(false)
const coinChooseVisible = ref(false)
const selectedOption = ref(null)
const Visible = ref(true)
const isLoadingBalance = ref(false)
const position = ref('')
const bridgeStep = ref(1)
const bridgeMode = ref('token') // token | nft

// NFT form state
import nftCollections from "../../assets/json/nftCollections.json"
const nftLocalCollection = ref('')
const nftRemoteCollection = ref('')
const nftTokenId = ref('') // 手动输入 tokenId
const nftSelectedTokenId = ref('') // 列表选择 tokenId
const nftTokenIdMode = ref('manual') // manual | list
const nftToAddress = ref('')
const isLoadingNftFee = ref(false)
const nftFeeWei = ref(0n)
const isLoadingNftList = ref(false)
const nftOwnedTokenIds = ref([])
const nftListError = ref('')
const nftFeeDisplay = computed(() => {
  try {
    if (!nftFeeWei.value) return '0'
    return `${formatUnits(nftFeeWei.value, 18)} ETH`
  } catch {
    return '0'
  }
})

const canSubmitNft = computed(() => {
  const effectiveTokenId = nftTokenIdMode.value === 'list' ? nftSelectedTokenId.value : nftTokenId.value
  return !!address.value &&
    !!nftLocalCollection.value &&
    !!nftRemoteCollection.value &&
    effectiveTokenId !== '' &&
    !!nftToAddress.value
})

const effectiveNftTokenId = computed(() => {
  return nftTokenIdMode.value === 'list' ? nftSelectedTokenId.value : nftTokenId.value
})

function toggleTokenIdMode() {
  if (nftTokenIdMode.value === 'list') {
    nftTokenIdMode.value = 'manual'
    return
  }
  nftTokenIdMode.value = 'list'
  if (nftOwnedTokenIds.value.length && !nftSelectedTokenId.value) {
    nftSelectedTokenId.value = nftOwnedTokenIds.value[0]
  }
}

async function refreshOwnedNfts() {
  // 只有 NFT 模式才加载
  if (bridgeMode.value !== 'nft') return
  nftListError.value = ''
  nftOwnedTokenIds.value = []
  nftSelectedTokenId.value = ''

  if (!address.value) return
  if (!nftLocalCollection.value || !ethers.isAddress(nftLocalCollection.value)) return

  try {
    isLoadingNftList.value = true

    // 仅当 NFT 合约支持 ERC721Enumerable 才能链上枚举 tokenId
    const ERC721_ENUMERABLE_ID = '0x780e9d63'
    let enumerable = false
    try {
      enumerable = await readContract(config, {
        chainId: fromChain.value.chainId,
        address: nftLocalCollection.value,
        abi: erc721ABI,
        functionName: 'supportsInterface',
        args: [ERC721_ENUMERABLE_ID]
      })
    } catch {
      enumerable = false
    }

    const bal = await readContract(config, {
      chainId: fromChain.value.chainId,
      address: nftLocalCollection.value,
      abi: erc721ABI,
      functionName: 'balanceOf',
      args: [address.value]
    })

    const balance = BigInt(bal || 0)
    if (balance === 0n) {
      nftOwnedTokenIds.value = []
      nftListError.value = t('bridge.nft.noNft')
      return
    }

    if (!enumerable) {
      nftListError.value = t('bridge.nft.notEnumerable')
      // 仍可手动输入 tokenId
      return
    }

    const limit = 50n
    const count = balance > limit ? limit : balance
    const ids = []
    for (let i = 0n; i < count; i++) {
      const tokenId = await readContract(config, {
        chainId: fromChain.value.chainId,
        address: nftLocalCollection.value,
        abi: erc721ABI,
        functionName: 'tokenOfOwnerByIndex',
        args: [address.value, i]
      })
      ids.push((BigInt(tokenId)).toString())
    }

    nftOwnedTokenIds.value = Array.from(new Set(ids))
    if (nftOwnedTokenIds.value.length) {
      nftTokenIdMode.value = 'list'
      nftSelectedTokenId.value = nftOwnedTokenIds.value[0]
    }
  } catch (e) {
    nftListError.value = t('bridge.nft.readFailed')
  } finally {
    isLoadingNftList.value = false
  }
}
const pageIndex = ref(1)

const isProcessing = ref(false)
const minBridgeAmount = ref(0.001)
const gasFeeEthStr = ref('')
const coinChoose = ref({
  img: "eth.svg",
  name: "ETH",
  minBridgeAmount: 0.1
})

const allCoinList = ref([
  {
    img: "eth.svg",
    name: "ETH",
    minBridgeAmount: 0.1
  }, {
    img: "usdt.png",
    name: "USDT",
    minBridgeAmount: 0.1
  },
  {
    img: "cp.svg",
    name: "DOL",
    minBridgeAmount: 0.1
  },

])
const txHash = ref('')
const approvalHash = ref('')
const isInsufficient = computed(() => {
  return Number(fromBalance.value) >= Number(coinChoose.value.minBridgeAmount) &&
    Number(fromBalance.value) >= Number(amount.value) && amount.value
})

watch(amount, (newValue, oldValue) => {
  // validatePositiveNumber(newValue, oldValue)
  if (!newValue) {
    bridgeAmount.value = ""
    return
  }
  // 保留5位精度，向下取整

  const result = new BigNumber(newValue).minus(new BigNumber(allbridgeFees.value))
  if (result.isLessThan(0)) {
    bridgeAmount.value = "0"  // 或者显示 "Insufficient funds" 等提示
    // 可选：显示错误提示

  } else {
    bridgeAmount.value = result.toFixed(8)
  }
})

watch(
  chain,
  (newChain, oldChain) => {
    if (newChain?.id !== oldChain?.id) {
      console.log('网络已切换:', oldChain?.id, '->', newChain?.id)
      // 网络切换后重新获取余额
      if (address.value) {
        initBridgeBalance()
      }
    }
  },
  { deep: true }
)

watch([bridgeMode, fromChain, toChain, address], async () => {
  if (bridgeMode.value !== 'nft') return

  // 自动填充接收地址
  if (address.value && !nftToAddress.value) nftToAddress.value = address.value

  // 尝试根据配置自动匹配 collection
  const match = (nftCollections || [])
    .flatMap(g => g.pairs || [])
    .find(p => Number(p.fromChainId) === Number(fromChain.value.chainId) && Number(p.toChainId) === Number(toChain.value.chainId))
  if (match) {
    if (!nftLocalCollection.value || nftLocalCollection.value === '0x0000000000000000000000000000000000000000') nftLocalCollection.value = match.localCollection
    if (!nftRemoteCollection.value || nftRemoteCollection.value === '0x0000000000000000000000000000000000000000') nftRemoteCollection.value = match.remoteCollection
  }

  // 读取 NFT 手续费（只有 DOL->其他链需要）
  try {
    isLoadingNftFee.value = true
    const bridgeContractAddress = fromChain.value.bridgeContract
    if (!bridgeContractAddress) {
      nftFeeWei.value = 0n
      return
    }
    const dolId = await readContract(config, {
      address: bridgeContractAddress,
      abi: bridgeABI,
      functionName: 'dolChainId'
    })
    const needsFee = BigInt(fromChain.value.chainId) === BigInt(dolId) && BigInt(toChain.value.chainId) !== BigInt(dolId)
    if (!needsFee) {
      nftFeeWei.value = 0n
      return
    }
    const fee = await readContract(config, {
      address: bridgeContractAddress,
      abi: bridgeABI,
      functionName: 'nftBridgeBaseFeePerChain',
      args: [BigInt(toChain.value.chainId)]
    })
    nftFeeWei.value = BigInt(fee || 0)
  } catch (e) {
    nftFeeWei.value = 0n
  } finally {
    isLoadingNftFee.value = false
  }
}, { immediate: true })

watch([bridgeMode, nftLocalCollection, address, fromChain], async () => {
  if (bridgeMode.value !== 'nft') return
  // 自动刷新持仓列表（地址/链/collection 变化时）
  await refreshOwnedNfts()
}, { immediate: true })
// 在 shortAddress 函数后添加
// 在 shortAddress 函数后添加
function validateAndCorrectAmount() {
  if (!amount.value) return
  
  let value = amount.value.toString()
  
  // 移除非数字字符（除了小数点）
  value = value.replace(/[^0-9.]/g, '')
  
  // 确保只有一个小数点（保留第一个，移除后续的）
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts[1]
  }
  
  // 移除开头的多个零（但保留 0.xxx 格式）
  if (value.startsWith('00')) {
    value = value.replace(/^0+/, '0')
  } else if (value.startsWith('0') && value.length > 1 && value[1] !== '.') {
    value = value.substring(1)
  }
  
  // 限制小数位数为8位
  if (value.includes('.')) {
    const [integer, decimal] = value.split('.')
    if (decimal.length > 8) {
      value = integer + '.' + decimal.substring(0, 8)
    }
  }
  
  // 确保不是负数
  const numValue = parseFloat(value)
  if (numValue < 0) {
    value = '0'
  }
  
  // 如果值发生了变化，更新 amount
  if (value !== amount.value) {
    amount.value = value
  }
}
function handleSubmitClick() {
  // 如果未连接钱包，则连接钱包
  if (!address.value) {

    isLogin.value = true

    return;
  }

  // 如果已连接钱包且满足条件，则执行桥接操作
  if (amount.value && isInsufficient.value) {

    // 1. 验证钱包连接
    if (!address.value) {
      ElMessage({
        message: UI_MESSAGES.value.connectWallet,
        type: 'warning',
        duration: 2000,
        showClose: true
      })
      return
    }

    // 2. 验证金额
    if (!amount.value || Number(amount.value) <= 0) {
      ElMessage({
        message: UI_MESSAGES.value.enterValidAmount,
        type: 'warning',
        duration: 2000,
        showClose: true
      })
      return
    }

    // 3. 检查最小桥接金额
    if (Number(amount.value) < coinChoose.value.minBridgeAmount) {
      ElMessage({
        message: `${UI_MESSAGES.value.minimumAmount} ${coinChoose.value.minBridgeAmount} ${coinChoose.value.name}`,
        type: 'warning',
        duration: 2000,
        showClose: true
      })
      return
    }

    // 4. 检查余额
    if (Number(fromBalance.value) < Number(amount.value)) {
      ElMessage({
        message: UI_MESSAGES.value.insufficientBalance,
        type: 'warning',
        duration: 2000,
        showClose: true
      })
      return
    }
    tab(2);
  }
}
function getImageUrl(fileName) {
  return new URL(`/src/assets/images/chain/${fileName}`, import.meta.url).href
}

function getImageUrl_1(fileName) {
  return new URL(`/src/assets/images/coin/${fileName}`, import.meta.url).href
}

function shortAddress(address) {
  if (typeof address !== 'string' || address.length < 10) {
    return ''
  }
  return address.slice(0, 6) + '...' + address.slice(-4)
}

function handleCurrentChange(val) {
  pageNumber.value = val
  getRecordsList()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 接收实时推送 刷新列表
async function Realtimerefresh() {
  // bridge-indexer-ws-testnet.cpchain.com/ws
  ws = new WebSocket("wss://bridge-indexer-ws-testnet.aqualink.com/ws");

  ws.onopen = function (evt) {
    console.log("Connection open ...");
    // ws.send("Hello WebSockets!");
  };

  ws.onmessage = async function (evt) {
    // await sleep(500)
    console.log("Received Message: " + evt.data);
    let result = JSON.parse(evt.data)
    console.log(result)
    if (result.status == 0) {
      await sleep(500)
      ElMessage({
        message: UI_MESSAGES.value.fundsArrived,
        type: 'success',
        duration: 3000,
        showClose: true
      })

      initBridgeBalance()
    }

    if (result.status == 1) {
      await sleep(500)

      console.log(result)
      initBridgeBalance()
    }

    // initBridgeBalance()
    // ws.close();
  };

  ws.onclose = function (evt) {
    console.log("Connection closed.");
  }
}

function formatTimestamp(ts) {
  // 如果是10位秒级时间戳，先乘1000
  if (ts.toString().length === 10) {
    ts = ts * 1000;
  }
  const date = new Date(ts);
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const D = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

function getIconUrl(filename) {
  return new URL(`../assets/images/chain/${filename}`, import.meta.url).href
}

function gotoScan(type, value, chainId) {
  const network = networks.find(network => network.chainId === Number(chainId));
  if (network && (type === 'tx' || type === 'address')) {
    let url = `${network.explorerUrl}/${type}/${value}`;
    window.open(url, "_blank");
  }
}

function showChain(state1) {
  showModal.value = true
  state.value = state1
  //  console.log(state)
  chains.value = networks
  search.value = ""
}

function ellipsisFilter(value) {
  if (typeof value !== 'string') return value;

  const startPart = value.slice(0, 4);
  const endPart = value.slice(-4);
  return `${startPart}...${endPart}`;
}

async function switchToNetwork(chainId) {
  try {
    await switchChain(config, { chainId })
    console.log('网络切换成功')
  } catch (error) {
    console.error('网络切换失败', error)
  }
}

function formatToken(value, symbol) {
  if (!value) return '0';

  const upperSymbol = symbol.trim().toUpperCase();
  const decimals = TOKEN_DECIMALS[upperSymbol] || 18;
  if (decimals === undefined) return 'UnknownToken';

  try {
    return formatUnits(BigInt(value), decimals);
  } catch (e) {
    return '0';
  }
}

function switchChains() {
  // 交换 UI 上的 fromChain 和 toChain
  let a = fromChain.value
  let b = toChain.value
  let temp = { ...a }
  Object.assign(a, b)
  Object.assign(b, temp)

  // 初始化桥接余额
  initBridgeBalance()
}

function tab(item) {
  bridgeStep.value = item
}

function fliterChain() {
  var arr = chains.value.filter(
    c =>
      c.name.toLowerCase().includes(search.value.toLowerCase().trim())
  );

  chains.value = arr

  if (search.value.toLowerCase().trim() === "") {
    chains.value = networks
  }
}

function fliterCoin() {
  var arr = allCoinList.value.filter(
    c =>
      c.name.toLowerCase().includes(search2.value.toLowerCase().trim())
  );

  allCoinList.value = arr

  if (search2.value.toLowerCase().trim() === "") {
    allCoinList.value = coinList
  }
}

function handleClose() {
  showModal.value = false;
  search.value = "";
}

function showCoin() {
  // console.log(coinList.value)
  allCoinList.value = coinList
  showModal2.value = true
  search2.value = ""
}

function initEthers(url, chainId) {
  let provider;
  if (chainId === 43851) {
    provider = new JsonRpcProvider(url, chainId, { staticNetwork: true })
  } else {
    provider = new JsonRpcProvider(url, chainId)
  }
  return provider;
}

onMounted(() => {
 
})

onUnmounted(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close()
    ws = ""
    console.log('页面卸载，主动关闭 WebSocket')
  }
})

watch(
  status,
  (newStatus) => {
    if (newStatus === "connected" || newStatus === "disconnected") {
      initBridgeBalance()
    }
    if (newStatus === "disconnected") {
      amount.value = ''
      fromBalance.value = ""
      toBalance.value = ""
      records.value = []
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
        console.log('页面卸载，主动关闭 WebSocket')
      }
    }
  }
)

async function getTokenBalance({ provider, address, chainInfo, tokenName }) {
  const isDolphinet = chainInfo.chainId === 86606;
  const token = tokenName.toUpperCase();
  const nativeToken = chainInfo.currency.toUpperCase();

  try {
    // ✅ 情况 1：原生币（如 ETH、DOL），且不是 Dolphinet 链上的 ETH
    if (token === nativeToken && !(isDolphinet && token === 'ETH')) {
      const balance = await provider.getBalance(address);
      console.log(`[原生币] ${token} - 余额:`, balance.toString());
      return parseFloat(ethers.formatUnits(balance, 18)).toFixed(6);
    }

    // ✅ 情况 2：Dolphinet链上的 ETH，走 ethContract 查询
    if (isDolphinet && token === 'ETH') {
      console.log(chainInfo)
      const ethContract = chainInfo.ethContract;
      if (!ethContract) {
        console.warn(`[警告] Dolphinet链未配置 ETH 合约地址`);
        return '0.000000';
      }
      console.log(`[Dolphinet链 ETH] 通过合约 ${ethContract} 查询`);
      const contract = new ethers.Contract(ethContract, erc20ABI, provider);
      const balance = await contract.balanceOf(address);
      return parseFloat(ethers.formatUnits(balance, 18)).toFixed(6);
    }

    // ✅ 情况 3：普通 ERC20 代币
    const contractKey = token.toLowerCase() + 'Contract';
    const erc20Addr = chainInfo[contractKey];

    if (!erc20Addr) {
      console.warn(`[警告] ${token} 未配置合约地址于链 ${chainInfo.name}`);
      return '0.000000';
    }

    console.log(`[ERC20] ${token} 合约地址: ${erc20Addr}`);
    const contract = new ethers.Contract(erc20Addr, erc20ABI, provider);
    const balance = await contract.balanceOf(address);
    return parseFloat(ethers.formatUnits(balance, 18)).toFixed(6);
  } catch (err) {
    console.error(`[错误] 查询 ${token} 余额失败:`, err);
    return '0.000000';
  }
}

async function initBridgeBalance() {
  if (!address.value) return

  console.log('地址:', address.value)

  fromBalance.value = '0.000000'
  toBalance.value = '0.000000'
  isLoadingBalance.value = true

  try {
    const providerFrom = await initEthers(fromChain.value.rpcUrl, fromChain.value.chainId)
    const providerTo = await initEthers(toChain.value.rpcUrl, toChain.value.chainId)

    // ✅ 处理 fromBalance
    fromBalance.value = await getTokenBalance({
      provider: providerFrom,
      address: address.value,
      chainInfo: fromChain.value,
      tokenName: coinChoose.value.name
    })
    console.log('fromBalance:', fromBalance.value)

    // ✅ 处理 toBalance
    toBalance.value = await getTokenBalance({
      provider: providerTo,
      address: address.value,
      chainInfo: toChain.value,
      tokenName: coinChoose.value.name
    })
    console.log('toBalance:', toBalance.value)

  } catch (err) {
    console.error('initBridgeBalance error:', err)
  }

  isLoadingBalance.value = false
  getBridgeFees()
  getRecordsList()
  Realtimerefresh()
}

const bridgeMethod = async () => {
  console.log("bridgeMethod 被调用", coinChoose.value.name);



  // 5. 检查并切换网络
  if (chain.value?.id !== fromChain.value.chainId) {
    try {
      console.log("切换网络 ------")
      await switchToNetwork(fromChain.value.chainId)

      // 等待网络切换完成
      await new Promise(resolve => setTimeout(resolve, 500))

      // 验证网络切换成功
      if (chain.value?.id !== fromChain.value.chainId) {
        throw new Error('网络切换失败，当前网络与目标网络不匹配')
      }

      console.log('网络切换验证成功')
    } catch (error) {
      console.error('网络切换失败:', error)
      ElMessage({
        message: UI_MESSAGES.value.switchNetwork,
        type: 'error',
        duration: 2000,
        showClose: true
      })
      return
    }
  }

  isProcessing.value = true

  try {
    // 6. 转换金额
    const amountInWei = parseEther(amount.value.toString())

    // 7. 获取桥接合约地址
    const bridgeContractAddress = fromChain.value.bridgeContract
    if (!bridgeContractAddress) {
      throw new Error('桥接合约地址未配置')
    }
    // 合约地址字段映射：DOL 使用 cpContract（而不是 dolContract）
    const tokenNameUpper = coinChoose.value.name?.toUpperCase?.() || ''
    const tokenKey =
      tokenNameUpper === 'DOL' ? 'cpContract' :
      tokenNameUpper === 'ETH'  ? 'ethContract' :
      tokenNameUpper === 'USDT' ? 'usdtContract' :
      (coinChoose.value.name.toLowerCase() + 'Contract')

    const tokenAddress = fromChain.value[tokenKey]
    const destTokenAddress = toChain.value[tokenKey]

    // 8. 调用桥接核心函数（使用新的动态解析逻辑）
    const result = await bridgeMethodOptimized({
      tokenName: coinChoose.value.name,
      tokenAddress: tokenAddress,
      destTokenAddress: destTokenAddress,
      amount: amountInWei,
      userAddress: address.value,
      bridgeContractAddress: bridgeContractAddress,
      fromChainId: fromChain.value.chainId,
      targetChainId: toChain.value.chainId,
      setTxHash: (hash) => {
        console.log('桥接交易哈希:', hash)
      },
      setApprovalHash: (hash) => {
        console.log('授权交易哈希:', hash)
      },
      BRIDGE_MESSAGES: BRIDGE_MESSAGES.value
    })

    console.log('桥接成功:', result)


    // 重置表单
    amount.value = ''
    bridgeStep.value = 1

    // 刷新余额
    await initBridgeBalance()

  } catch (error) {
    console.error('桥接失败:', error)

    let errorMessage = BRIDGE_MESSAGES.value.bridgeFailed
    if (error.message.includes('User rejected')) {
      errorMessage = BRIDGE_MESSAGES.value.userRejected
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = BRIDGE_MESSAGES.value.insufficientBalance
    } else if (error.message) {
      errorMessage = error.message
    }


  } finally {
    isProcessing.value = false
  }
}

async function getBridgeFees() {
  isloadingGas.value = true

  allusdtFees.value = ""
  allbridgeFees.value = ""
  var chainId = toChain.value.chainId
  var symbol = coinChoose.value.name.toLowerCase()
  var result = await getbridgeFees(chainId, symbol)
  allbridgeFees.value = result.data.predict_fee

  allusdtFees.value = calculateMarketPriceTimesFee(result.data.market_price, result.data.predict_fee)
  isloadingGas.value = false

  if (!amount.value) {
    bridgeAmount.value = ""
  } else {
    const result2 = new BigNumber(amount.value).minus(new BigNumber(allbridgeFees.value))

    // 检查结果是否为负数
    if (result2.isLessThan(0)) {
      bridgeAmount.value = "0"  // 或者显示 "Insufficient funds" 等提示
      // 可选：显示错误提示
      // console.warn('桥接金额不足，费用超过输入金额')
    } else {
      bridgeAmount.value = result2.toFixed(8)
    }
  }
}

async function getRecordsList() {
  if (!address.value) return
  var result = await getBridgeRecords(
    pageNumber.value,
    pageSize.value,
    "desc",
    address.value
  )
  records.value = result.data.Records
  Total.value = result.data.Total
  pageNumber.value = result.data.Current
}

function calculateMarketPriceTimesFee(market_price_str, predict_fee_str) {
  const predict_fee = new BigNumber(predict_fee_str);
  const market_price = new BigNumber(market_price_str);

  const result = predict_fee.multipliedBy(market_price);

  return result.toFixed(6);  // 保留 
}

function select(val) {
  selected.value = val;
  handleClose();
  if (val.chainId == fromChain.value.chainId || val.chainId == toChain.value.chainId) {
    switchChains()
    initBridgeBalance()
    return
  }
  if (state.value == 1 && val.chainId != fromChain.value.chainId) {
    fromChain.value = selected.value
    initBridgeBalance()
  }
  if (state.value == 2 && val.chainId != toChain.value.chainId) {
    toChain.value = selected.value
    initBridgeBalance()
  }
}

function select2(val) {
  console.log(val)
  coinChoose.value = val
  showModal2.value = false
  initBridgeBalance()
}

async function handleSubmitNft() {
  if (!address.value) {
    isLogin.value = true
    return
  }
  try {
    const bridgeContractAddress = fromChain.value.bridgeContract
    if (!bridgeContractAddress) throw new Error('bridgeContract not configured')

    // 切换网络到 fromChain
    if (chain.value?.id !== fromChain.value.chainId) {
      await switchToNetwork(fromChain.value.chainId)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    await bridgeNftOptimized({
      localCollection: nftLocalCollection.value,
      remoteCollection: nftRemoteCollection.value,
      tokenId: effectiveNftTokenId.value,
      userAddress: address.value,
      bridgeContractAddress,
      fromChainId: fromChain.value.chainId,
      targetChainId: toChain.value.chainId,
      toAddress: nftToAddress.value,
      BRIDGE_MESSAGES: BRIDGE_MESSAGES.value
    })
  } catch (e) {
    console.error(e)
  }
}
</script>


<style lang="scss" scoped>
.bridge {
  .bridge-mode-tabs {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-bottom: 12px;

    .mode-btn {
      height: 36px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid rgba(0, 119, 190, 0.18);
      background: rgba(255, 255, 255, 0.9);
      color: #1E293B;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;

      &.active {
        border-color: rgba(0, 119, 190, 0.35);
        background: linear-gradient(135deg, rgba(0, 119, 190, 0.12) 0%, rgba(0, 180, 216, 0.10) 100%);
        color: #0077BE;
      }
    }
  }

  .nft-card {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 119, 190, 0.15);
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0, 119, 190, 0.06);
    padding: 16px;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 16px;

    .nft-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;

      .nft-label {
        color: #64748B;
        font-size: 12px;
        font-weight: 500;
      }

      .nft-input {
        height: 40px;
        border-radius: 12px;
        border: 1px solid rgba(0, 119, 190, 0.15);
        padding: 0 12px;
        outline: none;
        background: rgba(255, 255, 255, 0.9);
        color: #1E293B;
        font-size: 14px;

        &::placeholder {
          color: #94A3B8;
        }
      }
    }

    .nft-tokenid-wrap {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .nft-tokenid-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .nft-mini-btn {
      height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid rgba(0, 119, 190, 0.18);
      background: rgba(255, 255, 255, 0.9);
      color: #0077BE;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      user-select: none;
      -webkit-appearance: none;
      appearance: none;
    }

    .nft-mini-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .nft-select {
      height: 40px;
      border-radius: 12px;
      border: 1px solid rgba(0, 119, 190, 0.15);
      padding: 0 12px;
      outline: none;
      background: rgba(255, 255, 255, 0.9);
      color: #1E293B;
      font-size: 14px;
      -webkit-appearance: none;
      appearance: none;
    }

    .nft-hint {
      color: #64748B;
      font-size: 12px;
      line-height: 1.3;

      &.error {
        color: #EF4444;
      }
    }

    .nft-fee {
      color: #64748B;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;

      img {
        width: 18px;
        animation: rotate 5s linear infinite;
      }

      span {
        color: #1E293B;
        font-weight: 500;
      }
    }
  }
  .error-message {
    color: #ff4757;
    font-size: 12px;
    font-weight: normal;

  }

  background: linear-gradient(135deg, #F0F8FF 0%, #E0F2FE 30%, #B8E6FF 50%, #E0F2FE 70%, #F0F8FF 100%);
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(0, 183, 216, 0.08) 0%, transparent 60%),
      radial-gradient(circle at 80% 70%, rgba(0, 119, 190, 0.08) 0%, transparent 60%),
      radial-gradient(circle at 50% 50%, rgba(74, 158, 255, 0.05) 0%, transparent 70%);
    pointer-events: none;
  }
  
  @keyframes gradientShift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
  width: 100vw;
  overflow-x: hidden;
  min-height: 100vh;
  min-height: -webkit-fill-available; /* iOS Safari */
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  align-items: center;
  padding: 80px 0;
  padding-top: max(80px, env(safe-area-inset-top));
  padding-bottom: max(80px, env(safe-area-inset-bottom));

  button:disabled {
    cursor: not-allowed
      /* ... */
  }

  :deep(.el-pager li) {
    background: transparent;
    color: #fff;
  }

  .pagination {
    display: flex;
    width: 100%;
    justify-content: flex-end;
  }

  :deep(.el-pagination button:disabled) {
    background: transparent;
    color: #666868;
  }

  :deep(.el-pagination .btn-next) {
    background: transparent;
  }

  :deep(.el-pagination .btn-prev) {
    background: transparent !important;
  }

  :deep(.el-pager li.is-active) {
    border-radius: 8px;
    background: linear-gradient(135deg, #0077BE 0%, #00B4D8 100%);
    color: #1A1E1D;
    text-align: center;

    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    /* 157.143% */

  }

  .pagination {
    height: 60px;
    padding-top: 30px;
    text-align: right;
  }

  #gascontainer {

    padding-left: 16px;

    display: flex;
    // justify-content: center;
    align-items: center;

    span {
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      color: #8E8E92;
    }

    img {
      width: 20px;
      animation: rotate 5s linear infinite;
    }
  }



  .swap-container {
    max-width: 480px;
    height: 550px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    z-index: 1;

    h1 {
      color: #FFF;
      text-align: center;
      font-size: 40px;
      font-style: normal;
      font-weight: 600;
      line-height: normal;
      margin-bottom: 32px;
      font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      
      .title-part1 {
        font-size: 28px;
        font-weight: 500;
        background: linear-gradient(135deg, #0077BE 0%, #00B4D8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        color: #1E293B;
        letter-spacing: -0.5px;
      }
      
      .title-part2 {
        font-size: 56px;
        font-weight: 700;
        font-family: 'Cormorant Garamond', 'Playfair Display', 'Cinzel', serif;
        background: linear-gradient(135deg, #0077BE 0%, #00B4D8 50%, #4A9EFF 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 1.5px;
        font-style: italic;
        text-transform: capitalize;
      }
    }

    .content {
      padding: 16px;
      max-width: 480px;
      // height: 450px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 119, 190, 0.08), 0 2px 8px rgba(0, 119, 190, 0.04);
      border: 1px solid rgba(0, 119, 190, 0.1);

      .item {
        position: relative;
        margin-bottom: 16px;
        justify-content: space-between;

        .arrow-wrap {
          cursor: pointer;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.9);
          border: 1.6px solid rgba(0, 119, 190, 0.2);
          box-shadow: 0 2px 8px rgba(0, 119, 190, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          // margin: 0 -19px; // 向两侧溢出半径
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translateX(-50%) translateY(-50%);
          //    transform: translateY(-50%);
          z-index: 2;
          box-shadow: 0 1px 8px #0002 inset;

        }

        .arrow {
          color: #0077BE;
          font-size: 14px;
          font-weight: 700;
          display: inline-block;
          transform: translateY(-1px);
        }

        display: flex;
        // justify-content: space-around;

        .chain-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: none;
          padding: 0;
          margin: 0;
          width: 100%;
          position: relative;
          z-index: 1;
          margin-bottom: 8px;
        }

        .chain-card {
          cursor: pointer;
          // flex: 1 1 0%;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          height: 72px;
          border: 1px solid rgba(0, 119, 190, 0.15);
          box-shadow: 0 2px 8px rgba(0, 119, 190, 0.06);
          transition: all 0.4s ease;
          box-sizing: border-box;
          min-width: 0;
          
          &:hover {
            border-color: rgba(0, 119, 190, 0.22);
            box-shadow: 0 3px 10px rgba(0, 119, 190, 0.08);
            transform: translateY(-1px);
          }

          img {
            width: 40px;
            display: block;
          }

          &.left {
            width: calc(50% - 5px);
            // margin-right: 34px;
            justify-content: flex-start;
          }

          &.right {
            width: calc(50% - 5px);
            justify-content: flex-end;
          }

          .icon {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            object-fit: contain;
            background: #191b20;
            box-shadow: 0 1px 6px #15151522 inset;
          }

          .label {
            color: #64748B;
            // text-align: center;

            font-size: 14px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;
          }

          .name {
            color: #1E293B;

            font-size: 14px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;
          }
        }
      }

      .amount-card {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 119, 190, 0.15);
        border-radius: 20px;
        box-shadow: 0 2px 8px rgba(0, 119, 190, 0.06);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 16px;
        margin-bottom: 16px;
        width: 100%;
        box-sizing: border-box;
        height: 99px;
        position: relative;

        .amount-main {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          flex: 1;

          .amount-value {
            color: #1E293B;

            font-size: 32px;
            font-style: normal;
            font-weight: 600;
            line-height: normal;

            input[type="number"]::-webkit-outer-spin-button,
            input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }

            input[type="number"] {
              -moz-appearance: textfield;
              /* 可选：再加上自己需要的样式 */
              appearance: textfield;
              /* 新标准也支持，但兼容性有限 */
            }

            input {
              border: 0;
              outline: none;
              background: transparent;
              color: #1E293B;
              width: 200px;
              // text-align: center;
              // font-family: "TT Hoves Pro Trial";
              font-size: 32px;
              font-style: normal;
              font-weight: 600;
              line-height: normal;
            }
          }

          .amount-usd {
            color: #1E293B;

            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
            // margin-top: 5px;
          }
        }

        .amount-side {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-between;
          height: 100%;
          min-width: 180px;

          .token-selector {
            display: flex;
            align-items: center;
            cursor: pointer;
            border-radius: 100px;
            border: 1px solid #2E2F32;

            background: rgba(255, 255, 255, 0.95);
            border-radius: 24px;
            border: 1px solid rgba(0, 119, 190, 0.15);
            box-shadow: 0 2px 8px rgba(0, 119, 190, 0.06);
            padding: 8px 12px;
            min-width: 72px;
            // height: 44px;
            font-size: 1.12rem;
            color: #fff;
            font-weight: 600;
            // margin-bottom: 30px;
            gap: 4px;

            .token-icon {
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #11df72;
              margin-right: 6px;
            }

            span {
              color: #1E293B;
              text-align: center;

              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
            }

            .arrow {
              margin-left: 8px;
              margin-top: 2px;
              width: 16px;
              height: 16px;
              display: inline-block;
            }
          }

          .amount-avail {

            color: #64748B;
            display: flex;
            align-items: center;
            justify-content: space-around;
            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;

            img {
              width: 20px;
              animation: rotate 5s linear infinite;
            }

            span {
              color: #1E293B;

              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
            }
          }
        }
      }

      .summary-card {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 119, 190, 0.15);
        border-radius: 20px;
        box-shadow: 0 2px 8px rgba(0, 119, 190, 0.06);
        padding: 16px;
        width: 100%;
        box-sizing: border-box;
        height: 107px;
        margin-bottom: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .summary-main {
          display: flex;
          align-items: center;
          gap: 10px;

          .summary-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;

            object-fit: cover;
          }

          .summary-info {
            display: flex;
            flex-direction: column;
            justify-content: center;

            .summary-amt {
              color: #1E293B;

              font-size: 24px;
              font-style: normal;
              font-weight: 600;
              line-height: normal;
            }

            .summary-usd {
              color: #1E293B;

              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
            }
          }
        }

        .summary-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          // margin-top: 10px;

          .summary-fee {
            display: flex;
            color: #64748B;

            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;

            span {
              color: #64748B;
            }

            ;

            img {
              width: 20px;
              animation: rotate 5s linear infinite;
            }
          }

          .summary-time {
            color: #64748B;

            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;

            .clock {
              vertical-align: middle;
              margin-top: 1px;
              font-size: 10px;
            }
          }
        }
      }

      .submit-btn {
        width: 100%;
        // padding: 20px  0;
        display: block;
        height: 48px;
        border: none;
        outline: none;
        background: linear-gradient(135deg, #0077BE 0%, #00B4D8 100%);
        border-radius: 999px;
        box-shadow: 0 4px 16px rgba(0, 119, 190, 0.3);
        font-size: 16px;
        font-style: normal;
        font-weight: 500;
        color: #1A1E1D;
        cursor: pointer;
        // margin-top: 16px;
        transition: all 0.3s ease;

        &:hover,
        &:active {
          background: linear-gradient(135deg, #006BA3 0%, #00A0C8 100%);
          box-shadow: 0 5px 18px rgba(0, 119, 190, 0.25);
          transform: translateY(-0.5px);
        }
        
        // connect wallet 文字颜色
        span:first-child {
          color: #FFFFFF !important;
        }
      }

      .submit-btn:disabled {
        cursor: not-allowed;
        background: rgba(148, 163, 184, 0.2) !important;
        color: #94A3B8 !important;
        box-shadow: none !important;
        opacity: 0.7;
        transform: none !important;
        
        &:hover,
        &:active {
          background: rgba(148, 163, 184, 0.2) !important;
          box-shadow: none !important;
          transform: none !important;
        }
      }

    }

  }

  .recordList {
    width: 100%;
    padding: 0 120px;
    margin-top: 40px;

    .records-title {
      color: #1a1a1a;
      font-size: 24px;
      font-style: normal;
      font-weight: 500;
      line-height: normal;
      margin-bottom: 24px;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 119, 190, 0.08), 0 2px 8px rgba(0, 119, 190, 0.04);
      border: 1px solid rgba(0, 119, 190, 0.1);

      thead {
        background: rgba(0, 119, 190, 0.05);
        
        th {
          color: #64748B;
          font-size: 12px;
          font-style: normal;
          font-weight: 500;
          line-height: normal;
          height: 48px;
          text-align: left;
          padding: 0 16px;
          border-bottom: 1px solid rgba(0, 119, 190, 0.1);
          
          &:first-child {
            padding-left: 24px;
          }
          
          &:last-child {
            padding-right: 24px;
          }
        }
      }

      tbody {
        tr {
          height: 64px;
          transition: background-color 0.2s ease;
          
          &:hover {
            background-color: rgba(0, 119, 190, 0.03);
          }

          td {
            color: #1E293B;
            font-size: 14px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;
            padding: 0 16px;
            border-bottom: 1px solid rgba(0, 119, 190, 0.05);
            
            &:first-child {
              padding-left: 24px;
            }
            
            &:last-child {
              padding-right: 24px;
            }

            .status {
              font-weight: 500;

              &.success {
                color: #0077BE;
              }

              &.fail {
                color: #f4575e;
              }
            }
          }
          
          &:last-child td {
            border-bottom: none;
          }

          .goScan {
            color: #0077BE;
            transition: color 0.2s ease;
            cursor: pointer;
            
            &:hover {
              color: #005A8F;
              text-decoration: underline;
            }
          }
        }

        .alt {
          background: rgba(240, 248, 255, 0.3);
        }
      }
    }

    ul {
      display: none;
    }
  }

  /* iPhone specific optimizations */
  @media (max-width: 430px) {
    .bridge {
      padding: 60px 0;
      padding-top: max(60px, env(safe-area-inset-top));
      padding-bottom: max(60px, env(safe-area-inset-bottom));
    }
  }

  @media (max-width: 390px) {
    .bridge {
      padding: 50px 0;
      padding-top: max(50px, env(safe-area-inset-top));
      padding-bottom: max(50px, env(safe-area-inset-bottom));
    }
  }

  @media (max-width: 375px) {
    .bridge {
      padding: 40px 0;
      padding-top: max(40px, env(safe-area-inset-top));
      padding-bottom: max(40px, env(safe-area-inset-bottom));
    }
  }

  @media (max-width: 768px) {
    .recordList {
      width: calc(100% - 30px);
      padding: 0 15px;

      .records-title {
        color: #1a1a1a;

        font-size: 18px;
        font-style: normal;
        font-weight: 500;
        line-height: normal;
      }

      table {
        width: 100%;

        display: none
      }

      ul {
        display: block;
        list-style: none;
        margin-top: 24px;
        padding: 0;

        li {
          margin-bottom: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 119, 190, 0.06);
          border: 1px solid rgba(0, 119, 190, 0.1);
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 119, 190, 0.1);
            transform: translateY(-1px);
          }

          .item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 24px;
            margin-bottom: 12px;

            .name {
              color: #1E293B;
              font-size: 16px;
              font-style: normal;
              font-weight: 600;
              line-height: normal;
            }

            .see {
              color: #64748B;

              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
            }

            .sendName {
              color: #64748B;

              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
            }

            .time {
              color: #64748B;

              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
            }

            .receiveName {
              color: #64748B;

              font-size: 12px;
              font-style: normal;
              font-weight: 500;
              line-height: normal;
            }

            .statues {
              color: #64748B;

              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
            }

            .status {
              font-weight: 500;
              font-size: 12px;

              &.success {
                color: #0077BE;
              }

              &.fail {
                color: #f4575e;
              }
            }
          }

          .item:first-child {
            min-height: 28px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(0, 119, 190, 0.1);
          }
          
          .item:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }

  .record {
    width: 100%;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;

    .container {
      max-width: 1200px;
      min-height: 200px;


    }
  }

  $modal-bg: #181A1B;
  $modal-radius: 20px;
  $modal-padding: 32px 28px 24px 28px;

  $block-bg: #121212;
  $block-border: #232427;
  $block-radius: 16px;

  $text-main: #fff;
  $text-secondary: #8E8E92;
  $primary: #0077BE;
  $primary-hover: #005A8F;

  .confirm-modal {
    max-width: 420px;
    width: calc(100% - 48px);
    // margin: 100px auto 0;
    background: rgba(255, 255, 255, 0.98);
    border-radius: $modal-radius;
    backdrop-filter: blur(20px);
    box-shadow: 0 12px 40px rgba(0, 119, 190, 0.15), 0 4px 12px rgba(0, 119, 190, 0.08);
    border: 1px solid rgba(0, 119, 190, 0.1);
    box-shadow: 0 12px 32px #000a;
    padding: 24px;
    //  display: flex;
    //  flex-direction: column;
    //  gap: 18px;
    // color: $text-main;
    position: relative;

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;

      .modal-title {
        font-size: 20px;
        font-style: normal;
        font-weight: 500;
        line-height: normal;
        color: #1a1a1a;
      }

      .close-btn {
        font-size: 22px;
        color: #1a1a1a;

        cursor: pointer;
        transition: color .18s;

        &:hover {
          color: $primary;
        }
      }
    }

    .modal-block {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      border: 1px solid rgba(0, 119, 190, 0.15);
      box-shadow: 0 2px 8px rgba(0, 119, 190, 0.06);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 8px;

      .block-row {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .block-chain {
          display: flex;
          align-items: center;
          gap: 4px;

          .block-icon {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #222;
          }

          .block-label {
            color: #1E293B;

            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
          }
        }

        .block-addr {
          color: #1a1a1a;
          text-align: center;

          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
          border-radius: 100px;

          background: rgba(0, 119, 190, 0.08);
          border: 1px solid rgba(0, 119, 190, 0.15);
          display: inline-block;
          padding: 2px 10px;
        }
      }

      .block-amount {
        // margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 8px;

        .amount-icon {
          width: 32px;
          height: 32px;
        }

          .amount-value {
            color: #1E293B;
            text-align: center;

            font-size: 24px;
            font-style: normal;
            font-weight: 600;
            line-height: normal;
          }
      }
    }

    .modal-info {
      margin-top: 16px;
      background: none;
      border-radius: $block-radius;
      border: 1px solid #27282B;
      padding: 0 2px;
      display: flex;
      flex-direction: column;
      gap: 0;

      .info-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 42px;
        font-size: 15px;
        padding: 0 16px;
        border-bottom: 1px solid #27282B;

        &:last-child {
          border-bottom: none;
        }

        .info-label {
          color: #1a1a1a;

          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
        }

        .info-value {
          color: #1a1a1a;

          font-size: 12px;
          font-style: normal;
          font-weight: 500;
          line-height: normal;
        }
      }
    }

    .modal-btn {
      margin-top: 24px;
      width: 100%;
      height: 48px;
      background: $primary;
      border-radius: 999px;
      border: none;
      color: #1A1E1D;
      font-size: 16px;
      font-weight: 500;
      letter-spacing: 2px;
      cursor: pointer;
      transition: background .18s;

      img {
        width: 30px;
        animation: rotate 5s linear infinite;
      }

      &:hover {
        background: $primary-hover;
      }
    }
  }

  .modal-btn:disabled {
    cursor: not-allowed;
  }



  .open-btn {
    margin: 40px;
    padding: 8px 24px;
    border-radius: 8px;
    border: none;
    background: #23242b;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
  }

  .selected-info {
    margin: 30px 0 0 40px;
    font-size: 16px;
    color: #fff;
  }

  .chain-select-modal {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;

  }

  .chain-select-content {
    max-width: 390px;
    width: 100%;
    height: auto;
    background: rgba(255, 255, 255, 0.98);
    border-radius: 16px;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0, 119, 190, 0.15), 0 2px 8px rgba(0, 119, 190, 0.08);
    border: 1px solid rgba(0, 119, 190, 0.1);
    padding: 24px;
    box-shadow: 0 4px 32px 0 rgba(0, 0, 0, 0.35);
    animation: showModal .2s;
    height: 430px;
    position: absolute;
    bottom: 20%;
    // left: 50%;
    // transform: translateX(-50%);

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 20px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 24px;

        span {
          color: #1a1a1a;

          font-size: 20px;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
        }

      // padding: 0 32px 8px 32px;

      .close-btn {
        font-size: 20px;
        cursor: pointer;
        user-select: none;
        transition: color 0.15s;

        &:hover {
          color: #0077BE;
        }
      }
    }

    .search-box {
      // margin: 0 32px 16px 32px;
      display: flex;

      input {
        flex: 1;
        border: none;
        outline: none;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0, 168, 255, 0.2);
        border-radius: 100px;
        height: 38px;
        padding: 0 14px;
        font-size: 15px;

        color: #1a1a1a;

        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;

        &::placeholder {
          color: #94A3B8;
        }
      }
    }

    .chain-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      // margin: 0 24px;

      .chain-item {
        display: flex;
        align-items: center;
        gap: 16px;
        height: 64px;
        cursor: pointer;
        border-radius: 14px;
        padding: 0 16px;
        transition: background .13s;
        color: #1E293B;
        color: #1E293B;



        .chain-icon {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          // background: #23242b;
          object-fit: contain;
        }

        .chain-name {
          flex: 1;
          font-size: 14px;
          font-style: normal;
          font-weight: 500;
          color: #1E293B;
          line-height: normal;

        }

        .check-mark {
          color: #0077BE;
          font-size: 22px;
          font-weight: bold;
        }

        &:hover,
        &.active {
          background: rgba(0, 119, 190, 0.04);
        }
      }
    }
  }

  @keyframes showModal {
    from {
      transform: scale(0.92);
      opacity: 0;
    }

    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {

    .confirm-modal {
      position: relative;
      width: 100%;
      max-width: 100%;
      margin: 0;
      padding: 24px;
      animation: showModal 0.25s ease;
      transform: none;
      left: auto;
      bottom: auto;
      border-radius: 20px;

      .modal-header {
        margin-bottom: 20px;
      }
    }

    @keyframes showModal {
      from {
        transform: scale(0.92);
        opacity: 0;
      }

      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes showModalCentered {
      from {
        transform: translate(-50%, 0) scale(0.92);
        opacity: 0;
      }

      to {
        transform: translate(-50%, 0) scale(1);
        opacity: 1;
      }
    }

    .chain-select-content {
      position: fixed;
      left: 50%;
      top: max(12vh, env(safe-area-inset-top) + 32px);
      transform: translate(-50%, 0);
      width: 92vw;
      height: auto;
      max-height: 80vh;
      padding: 20px;
      border-radius: 20px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
      animation: showModalCentered 0.25s ease;
      display: flex;
      flex-direction: column;
      bottom: auto;
      box-sizing: border-box;

      .header {
        font-size: 18px;
      }
      
      .search-box {
        flex-shrink: 0;
      }

      .chain-list {
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 20px;
        
        .chain-item {
          min-height: 56px;
        }
      }
    }

    .swap-container {
      max-width: 480px;
      height: auto;
      min-height: auto;
      margin: 0 auto;
      width: 100%;
      padding: 0 16px;
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));

      h1 {
        margin-bottom: 20px;
        gap: 0;
        
          .title-part1 {
          font-size: 16px;
          letter-spacing: -0.2px;
          margin-bottom: 2px;
        }
        
        .title-part2 {
          font-size: 32px;
          letter-spacing: 0.5px;
          line-height: 1.1;
        }
      }

      .content {
        padding: 16px;
        padding-left: max(16px, env(safe-area-inset-left));
        padding-right: max(16px, env(safe-area-inset-right));
        border-radius: 20px;

        .item {
          margin-bottom: 12px;

          .arrow-wrap {
            width: 36px;
            height: 36px;
            min-width: 36px;
            min-height: 36px;
          }

          .chain-row {
            margin-bottom: 8px;
          }

          .chain-card {
            padding: 12px;
            min-height: 64px;
            height: 64px;
            border-radius: 16px;

            .icon {
              width: 32px;
              height: 32px;
            }

            .label {
              font-size: 12px;
            }

            .name {
              font-size: 13px;
            }
          }
        }

        .amount-card {
          padding: 14px;
          margin-bottom: 12px;
          height: auto;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;

          .amount-main {
            width: 100%;

            .amount-value {
              input {
                font-size: 28px;
                width: 100%;
              }
            }
          }

          .amount-side {
            width: 100%;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            height: auto;
            min-width: 0;

            .token-selector {
              order: 2;
              margin: 0;
              padding: 6px 12px;
              min-width: auto;
            }

            .amount-avail {
              order: 1;
              justify-content: flex-start;
            }
          }
        }

        .summary-card {
          padding: 14px;
          height: auto;
          margin-bottom: 16px;
          gap: 12px;

          .summary-main {
            .summary-icon {
              width: 28px;
              height: 28px;
            }

            .summary-info {
              .summary-amt {
                 font-size: 18px;
              }
            }
          }

          .summary-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .summary-fee {
              display: flex;
              color: #64748B;
              font-size: 11px;
              font-weight: 400;

              span {
                color: #64748B;
              }

              img {
                width: 20px;
                animation: rotate 5s linear infinite;
              }
            }

            .summary-time {
              color: #64748B;
              font-size: 11px;
              font-weight: 400;

              .clock {
                vertical-align: middle;
                margin-top: 1px;
                font-size: 10px;
              }
            }
          }
        }

        .submit-btn {
          width: 100%;
          display: block;
          min-height: 48px;
          height: 48px;
          border: none;
          outline: none;
          background: linear-gradient(135deg, #0077BE 0%, #00B4D8 100%);
          border-radius: 999px;
          box-shadow: 0 4px 16px rgba(0, 119, 190, 0.3);
          font-size: 16px;
          font-style: normal;
          font-weight: 500;
          color: #1A1E1D;
          cursor: pointer;
          transition: all 0.3s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          -webkit-appearance: none;
          appearance: none;
          user-select: none;

          &:hover,
          &:active {
            background: linear-gradient(135deg, #006BA3 0%, #00A0C8 100%);
            box-shadow: 0 5px 18px rgba(0, 119, 190, 0.25);
            transform: translateY(-0.5px);
          }
          
          &:active {
            transform: scale(0.98);
          }
          
          span:first-child {
            color: #FFFFFF !important;
          }
        }

        .submit-btn:disabled {
          cursor: not-allowed;
          background: rgba(148, 163, 184, 0.2) !important;
          color: #94A3B8 !important;
          box-shadow: none !important;
          opacity: 0.7;
          transform: none !important;
          
          &:hover,
          &:active {
            background: rgba(148, 163, 184, 0.2) !important;
            box-shadow: none !important;
            transform: none !important;
          }
        }
      }
    }
  }
}
</style>
