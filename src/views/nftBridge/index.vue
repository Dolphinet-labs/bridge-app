<template>
  <div class="bridge">
    <div style="color: #fff;width:100%; display: flex; align-items: center;justify-content: center;margin-bottom: 30px; ">
      <el-button-group class="mb-4">
        <el-button type="success" round @click="$router.push('/')">erc2.0 bridge</el-button>
        <el-button type="success" round @click="$router.push('/nft')">
          nft bridge

        </el-button>
      </el-button-group>


    </div>
    <div class="swap-container">

      <div class="content">
        <!-- 链选择区域 -->
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

        <!-- NFT 选择区域 -->
        <div class="amount-card">
          <label for="">NFT:</label>
          <el-select v-model="nftValue" clearable placeholder="请选择 nft" style="width: 240px" @change="changeNft()">
            <el-option v-for="item in nftOptions" :key="item.destTokenAddress" :label="item.name" :value="item.name" />
          </el-select>
        </div>

        <!-- TokenID 选择区域 -->
        <div class="amount-card">
          <label for="">TokenID:</label>
          <el-select v-model="tokenIdValue" clearable placeholder="请选择 tokenId" style="width: 240px">
            <el-option v-for="item in tokenIdOptions" :key="item.tokenId" :label="item.name" :value="item.tokenId">
              <div class="tokenItem" style="display: flex; align-items: center; justify-content: space-between;">
                <el-avatar :src="item.image" size="small" />
                <span>{{ item.tokenId }}</span>
                <span>{{ item.name }}</span>
              </div>
            </el-option>
          </el-select>
        </div>

        <!-- 提交按钮 (已修改支持 Loading 状态) -->
        <button class="submit-btn" @click="handleSubmitClick" :disabled="isSubmitting"
          :class="{ 'is-loading': isSubmitting }">
          <!-- Loading 状态显示 -->
          <div v-if="isSubmitting" class="loading-content">
            <svg class="loading-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M512 64a448 448 0 1 1-448 448 448 448 0 0 1 448-448m0-64a512 512 0 1 0 512 512 512 512 0 0 0-512-512z"
                fill="#1A1E1D" opacity="0.3"></path>
              <path d="M512 64a448 448 0 0 1 448 448h64a512 512 0 0 0-512-512z" fill="#1A1E1D"></path>
            </svg>
            <span>交易处理中...</span>
          </div>

          <!-- 正常状态显示 -->
          <span v-else>
            <span v-if="!address">{{ $t('bridge.connectWallet') }}</span>
            <span v-else-if="!nftValue">请选择 NFT</span>
            <span v-else-if="!tokenIdValue">请选择 TokenID</span>
            <span v-else>立即跨链</span>
          </span>
        </button>
      </div>
    </div>

    <!-- 选择链弹窗 -->
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

    <!-- 历史记录  -->
    <div class="recordList">
      <div class="records-title"
        style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; ">{{
          $t('bridge.record.title') }}
        <el-icon :size="20" @click="getRecordsList()">
          <Refresh />
        </el-icon>
      </div>
      <div v-if="records.length > 0">
        <table cellpadding="0" cellspacing="0">
          <thead>
            <tr>
              <th>{{ $t('bridge.record.sourcehash') }}</th>
              <th>{{ $t('bridge.record.tosourcehash') }}</th>
              <th>{{ $t('bridge.record.name1') }}</th>
              <th>{{ $t('bridge.record.coin') }}</th>
              <th>{{ $t('bridge.record.fee') }}</th>
              <th>TokenId</th>
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
                row.amount
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
              <b class="sendName">TokedId
              </b>
              <span class="see">
                {{ row.amount }}
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
import { ethers } from 'ethers';
import { ref, onMounted, watch, computed, onUnmounted } from "vue"
import networks from "../../assets/json/networks.json"
import { getNfts, getTokenIdList } from "@/api/nft.js"
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'
// 引入优化后的 Core 逻辑
import { handleApprove, handleBridge } from "./nftCore.js"
import { switchChain } from '@wagmi/core'
import {
  useConnect, useAccount
} from '@wagmi/vue'
import { config } from '../../wagmi.ts'
import { getBridgeRecords } from "@/api/records.js"
const { t } = useI18n()
const counterStore = useCounterStore()
const { isLogin } = storeToRefs(counterStore)

// Wagmi Hooks
const { address, status } = useAccount()

// 状态变量
const nftValue = ref('')
const nftOptions = ref([])
const tokenIdValue = ref('')
const tokenIdOptions = ref([])
const isSubmitting = ref(false) // 新增：控制提交状态

// 链选择相关
const showModal = ref(false)
const selected = ref("cp")
const search = ref("")
const chains = ref(networks)
const fromChain = ref(networks[0])
const toChain = ref(networks[1])
const state = ref()
const pageNumber = ref(1)

const pageSize = ref(5)
const Total = ref(0)
const isloadingGas = ref(false)
const records = ref([])
function shortAddress(address) {
  if (typeof address !== 'string' || address.length < 10) {
    return ''
  }
  return address.slice(0, 6) + '...' + address.slice(-4)
}
const TOKEN_DECIMALS = {
  ETH: 18,
  USDT: 6,
  USDC: 6,
  DAI: 18,
  WBTC: 8,
  CP: 18,
  BNB: 18
};

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
// ==========================================
// 🚀 核心逻辑修改：提交处理函数
// ==========================================
async function handleSubmitClick() {
  // 1. 基础校验
  if (!address.value) {
    isLogin.value = true
    return;
  }

  if (!nftValue.value || !tokenIdValue.value) {
    ElMessage.warning('请完整选择 NFT 和 TokenID')
    return
  }

  // 防止重复点击
  if (isSubmitting.value) return
  isSubmitting.value = true

  // 2. 准备数据
  const currentChainId = fromChain.value.chainId
  const targetChainId = toChain.value.chainId

  const selectedNftInfo = nftOptions.value.find(item => item.name === nftValue.value)
  if (!selectedNftInfo) {
    ElMessage.error('NFT 信息获取失败')
    isSubmitting.value = false
    return
  }

  const localCollection = selectedNftInfo.sourceTokenAddress
  const remoteCollection = selectedNftInfo.destTokenAddress
  const bridgeContract = fromChain.value.bridgeContract
  const tokenId = tokenIdValue.value
  const userAddress = address.value

  try {
    // ------------------------------------------
    // Step 1: 授权 (全量授权检测)
    // ------------------------------------------
    // 如果之前已经全量授权过，这里会瞬间通过，不弹钱包
    const isApproved = await handleApprove({
      currentChainId: currentChainId,
      bridgeContract: bridgeContract,
      tokenId: tokenId,
      localCollection: localCollection,
      address: userAddress
    }, true) // true 表示必须等待授权上链

    if (!isApproved) throw new Error('授权未完成')

    // ------------------------------------------
    // Step 2: 跨链 (Fire and Forget 极速模式)
    // ------------------------------------------
    ElMessage.info('正在发起跨链请求...')

    const bridgeResult = await handleBridge({
      sourceChainId: currentChainId,
      targetChainId: targetChainId,
      localCollection: localCollection,
      remoteCollection: remoteCollection,
      bridgeContract: bridgeContract,
      tokenId: tokenId,
      address: userAddress,
      // ✨ 关键：false 表示不等待链上确认，拿到 Hash 即成功
      waitForReceipt: false
    })

    if (bridgeResult && bridgeResult.success) {
      ElMessage.success({
        message: '🚀 跨链请求已发送！请在钱包中查看详情',
        duration: 4000,
        showClose: true
      })
      console.log('Tx Hash:', bridgeResult.hash)
      // 可以在此处重置部分状态，或刷新列表
      await getNftList()
      await getRecordsList()
    }

  } catch (error) {
    console.error('交易失败:', error)
    const errorMsg = error.message || '未知错误'
    if (errorMsg.includes('rejected') || errorMsg.includes('User rejected')) {
      ElMessage.warning('用户取消了操作')
    } else if (errorMsg.includes('insufficient funds')) {
      ElMessage.error('账户余额不足以支付 Gas 费')
    } else {
      ElMessage.error('操作失败: ' + errorMsg)
    }
  } finally {
    isSubmitting.value = false
  }
}
async function getRecordsList() {
  if (!address.value) return

  var result = await getBridgeRecords(
    pageNumber.value,
    pageSize.value,
    "desc",
    address.value,
    1
  )
  console.log("----------------------------------------")
  records.value = result.data.Records
  Total.value = result.data.Total
  pageNumber.value = result.data.Current
}

// 辅助函数
function getImageUrl(fileName) {
  return new URL(`/src/assets/images/chain/${fileName}`, import.meta.url).href
}

function showChain(state1) {
  showModal.value = true
  state.value = state1
  chains.value = networks
  search.value = ""
}

function switchChains() {
  if (fromChain.value.chainId == 1520 || toChain.value.chainId == 1520) {
    let a = fromChain.value
    let b = toChain.value
    let temp = { ...a }
    Object.assign(a, b)
    Object.assign(b, temp)
    getNftList()
  } else {
    ElMessage({
      message: '其它链不能互夸,目前只支持dol <-> 其他链！',
      type: 'warning',
      plain: true,
    })
  }
}

function fliterChain() {
  var arr = chains.value.filter(
    c => c.name.toLowerCase().includes(search.value.toLowerCase().trim())
  );
  chains.value = arr
  if (search.value.toLowerCase().trim() === "") {
    chains.value = networks
  }
}

function handleClose() {
  showModal.value = false;
  search.value = "";
}

function changeNft() {
  getTokenIds()
}

function select(val) {
  selected.value = val;
  handleClose();
  if (val.chainId == fromChain.value.chainId || val.chainId == toChain.value.chainId) {
    switchChains()
    return
  }
  if (state.value == 1 && val.chainId != fromChain.value.chainId) {
    if (toChain.value.chainId == 1520) {
      fromChain.value = selected.value
      getNftList()
    } else {
      ElMessage({
        message: '其它链不能互夸,目前只支持dol <-> 其他链！',
        type: 'warning',
        plain: true,
      })
    }

  }
  if (state.value == 2 && val.chainId != toChain.value.chainId) {
    if (fromChain.value.chainId == 1520) {
      toChain.value = selected.value
      getNftList()
    } else {
      ElMessage({
        message: '其它链不能互夸,目前只支持dol <-> 其他链！',
        type: 'warning',
        plain: true,
      })
    }
  }
}

// API 交互
async function getNftList() {
  let fromChainId = fromChain.value.chainId
  let toChainId = toChain.value.chainId
  nftOptions.value = []
  nftValue.value = ''
  tokenIdValue.value = ''
  tokenIdOptions.value = []
  let result = await getNfts(fromChainId, toChainId)
  if (result.data.code == 200) {
    if (!result.data.list.nft) {

      return
    }
    nftOptions.value = result.data.list?.nft
  }
}

async function getTokenIds() {
  let chainId = fromChain.value.chainId
  let sourceTokenAddress = nftOptions.value.find(item => item.name === nftValue.value)?.sourceTokenAddress
  let owner = address.value
  tokenIdOptions.value = []
  tokenIdValue.value = ''
  if (!chainId || !sourceTokenAddress || !owner) {
    return
  }
  let result = await getTokenIdList(chainId, sourceTokenAddress, owner)
  if (result.data.code == 200) {
    if (!result.data.list.info) {
      ElMessage.warning("该系列下暂无 TokenID")
      return
    }
    tokenIdOptions.value = result.data.list?.info
  }
}

// 监听
watch(status, (newStatus) => {
  if (newStatus === "connected" || newStatus === "disconnected") {
    getNftList()
    getRecordsList()
  }
  if (newStatus === "disconnected") {
    nftValue.value = ''
    tokenIdValue.value = ''
    records.value = []
  }
})
function gotoScan(type, value, chainId) {
  const network = networks.find(network => network.chainId === Number(chainId));
  if (network && (type === 'tx' || type === 'address')) {
    let url = `${network.explorerUrl}/${type}/${value}`;
    window.open(url, "_blank");
  }
}
function handleCurrentChange(val) {
  pageNumber.value = val
  getRecordsList()
}

// 生命周期
onMounted(() => {
  // 如果已连接，初始化加载

  if (status.value === 'connected') {
    getNftList()
    getRecordsList()
  }
})
</script>

<style lang="scss" scoped>
// 旋转动画定义
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.bridge {
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
    background: #00CE7A;
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

  .recordList {
    width: 100%;
    padding: 0 120px;

    .records-title {
      color: #FFF;

      font-size: 24px;
      font-style: normal;
      font-weight: 500;
      line-height: normal;
    }

    table {
      width: 100%;


      thead {
        th {
          color: var(---, #8E8E92);

          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
          height: 40px;
          text-align: left;
        }
      }

      tbody {
        tr {

          height: 64px;

          td {

            color: #fff;
            font-size: 14px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;

            .status {
              font-weight: 500;

              &.success {
                color: #00CE7A;
              }

              &.fail {
                color: #f4575e;
              }
            }

          }

          .goScan:hover {
            cursor: pointer;
            color: #00c864;
          }
        }

        .alt {
          background: #1E1E1E;
        }


      }
    }

    ul {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .recordList {
      width: calc(100% - 30px);
      padding: 0 15px;

      .records-title {
        color: #FFF;

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
        margin-top: 40px;

        li {
          margin-bottom: 16px;

          border-bottom: 0.5px solid #2E2F32;

          .item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 17px;
            margin-bottom: 8px;

            .name {
              color: #F3F5F6;

              font-size: 15px;
              font-style: normal;
              font-weight: 500;
              line-height: normal;
            }

            .see {
              color: #8E8E92;

              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
            }

            .sendName {
              color: #8E8E92;

              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
            }

            .time {
              color: #8E8E92;

              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
            }

            .receiveName {
              color: #8E8E92;

              font-size: 12px;
              font-style: normal;
              font-weight: 500;
              line-height: normal;
            }

            .statues {
              color: #8E8E92;

              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
            }

            .status {
              font-weight: 500;
              font-size: 12px;

              &.success {
                color: #00CE7A;
              }

              &.fail {
                color: #f4575e;
              }
            }
          }

          .item:first-child {
            height: 21px;
            margin-bottom: 12px;
          }
        }
      }
    }
  }

  .tokenItem {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  :deep(.el-select__wrapper) {
    background-color: transparent;
    box-shadow: none;
  }

  background: #121212 url("../../assets/faucet_bg.png") no-repeat;
  background-size: 100% 100%;
  width: 100vw;
  overflow-x: hidden;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  align-items: center;
  padding: 80px 0;

  .swap-container {
    max-width: 480px;
    height: 550px;
    margin: 0 auto;
    width: 100%;

    h1 {
      color: #FFF;
      text-align: center;
      font-size: 40px;
      font-weight: 600;
      margin-bottom: 32px;
    }

    .content {
      padding: 16px;
      max-width: 480px;
      border-radius: 24px;
      background: #1E1E1E;

      .item {
        position: relative;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;

        .arrow-wrap {
          cursor: pointer;
          width: 32px;
          height: 32px;
          background: #1E1E1E;
          border: 1.6px solid #2E2F32;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translateX(-50%) translateY(-50%);
          z-index: 2;
          box-shadow: 0 1px 8px #0002 inset;

          .arrow {
            color: #00CE7A;
            font-size: 14px;
            font-weight: 700;
            transform: translateY(-1px);
          }
        }

        .chain-card {
          cursor: pointer;
          background: #1E1E1E;
          border-radius: 20px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          height: 72px;
          border: 1px solid #2E2F32;
          box-sizing: border-box;
          min-width: 0;
          transition: box-shadow 0.2s;

          img {
            width: 40px;
            display: block;
          }

          &.left {
            width: calc(50% - 5px);
            justify-content: flex-start;
          }

          &.right {
            width: calc(50% - 5px);
            justify-content: flex-end;
          }

          .label {
            color: #8E8E92;
            font-size: 14px;
            font-weight: 500;
          }

          .name {
            color: #FFF;
            font-size: 14px;
            font-weight: 500;
          }
        }
      }

      .amount-card {
        background: #1E1E1E;
        border: 1px solid #2E2F32;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        margin-bottom: 16px;
        width: 100%;
        box-sizing: border-box;
        position: relative;

        label {
          color: #fff;
          font-weight: bold;
          font-size: 16px;
        }
      }

      .submit-btn {
        width: 100%;
        display: block;
        height: 48px;
        border: none;
        outline: none;
        background: #00CE7A;
        border-radius: 999px;
        font-size: 16px;
        font-weight: 500;
        color: #1A1E1D;
        cursor: pointer;
        transition: background 0.18s, filter 0.18s, opacity 0.2s;

        &:hover,
        &:active {
          background: #00c864;
          filter: brightness(0.98);
        }

        // 禁用状态
        &:disabled {
          cursor: not-allowed;
          opacity: 0.8;
          // background: #2E2F32; // 可选：如果想变灰背景
        }

        // Loading 容器
        .loading-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 100%;
        }

        // Loading 图标
        .loading-icon {
          width: 20px;
          height: 20px;
          animation: rotate 1s linear infinite;
        }
      }
    }
  }

  // 弹窗样式
  .chain-select-modal {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;

    .chain-select-content {
      max-width: 390px;
      width: 100%;
      background: #151517;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 32px 0 rgba(0, 0, 0, 0.35);
      animation: showModal .2s;
      height: 430px;
      position: absolute;
      bottom: 20%;

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 20px;
        font-weight: bold;
        color: #fff;
        margin-bottom: 24px;

        .close-btn {
          cursor: pointer;

          &:hover {
            color: #ccc;
          }
        }
      }

      .search-box {
        display: flex;

        input {
          flex: 1;
          border: none;
          outline: none;
          background: #252629;
          border-radius: 100px;
          height: 38px;
          padding: 0 14px;
          font-size: 14px;
          color: #fff;

          &::placeholder {
            color: #666868;
          }
        }
      }

      .chain-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 16px;
        height: 300px;
        overflow-y: auto;

        .chain-item {
          display: flex;
          align-items: center;
          gap: 16px;
          height: 64px;
          cursor: pointer;
          border-radius: 14px;
          padding: 0 16px;
          color: #fff;

          .chain-icon {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            object-fit: contain;
          }

          .chain-name {
            flex: 1;
            font-size: 14px;
            font-weight: 500;
          }

          .check-mark {
            color: #00e782;
            font-size: 22px;
          }
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
    @keyframes showModal {
      from {
        transform: translateY(100%) scale(0.92);
        opacity: 0;
      }

      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }

    .chain-select-content {
      position: absolute;
      bottom: 0;
      width: 90vw;
      padding: 15px;
    }
  }
}
</style>