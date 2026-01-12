

import {
    readContract,
    writeContract,
    waitForTransactionReceipt,
    estimateFeesPerGas,
    estimateGas,
    switchChain,
    getAccount
} from '@wagmi/core'
import { config } from '../../wagmi.ts'
import { encodeFunctionData } from 'viem'

// ================= ABI 定义 (新增全量授权) =================
const ERC721_ABI = [
    // 原有的
    { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'tokenId', type: 'uint256' }], outputs: [] },
    { name: 'getApproved', type: 'function', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ name: '', type: 'address' }] },
    { name: 'ownerOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ name: '', type: 'address' }] },

    { name: 'setApprovalForAll', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }], outputs: [] },
    { name: 'isApprovedForAll', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'operator', type: 'address' }], outputs: [{ name: '', type: 'bool' }] }
]

const BRIDGE_ABI = [
    { name: 'BridgeInitiateLocalNFT', type: 'function', stateMutability: 'payable', inputs: [{ name: 'sourceChainId', type: 'uint256' }, { name: 'destChainId', type: 'uint256' }, { name: 'localCollection', type: 'address' }, { name: 'remoteCollection', type: 'address' }, { name: 'tokenId', type: 'uint256' }, { name: 'to', type: 'address' }], outputs: [] },
    { name: 'nativeBridgeFee', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] }
]

// ================= 辅助函数 (保持不变) =================

function safeBigInt(value) {
    if (typeof value === 'bigint') return value
    if (typeof value === 'string' || typeof value === 'number') {
        try {
            const strVal = value.toString().split('.')[0];
            return BigInt(strVal)
        } catch (error) {
            throw new Error(`数值格式错误: ${value}`)
        }
    }
    throw new Error(`不支持的数据类型: ${typeof value}`)
}

async function ensureCorrectChain(targetChainId) {
    const account = getAccount(config)
    const chainId = Number(targetChainId)
    if (!account.isConnected) throw new Error('请先连接钱包')
    if (account.chainId !== chainId) {
        try {
            await switchChain(config, { chainId })
        } catch (error) {
            if (error.code === 4001 || error.message.includes('rejected')) throw new Error('用户取消了切换网络')
            throw new Error('切换网络失败')
        }
    }
}

async function computedGas(abi, functionName, args, to, account, value = 0n, chainId) {
    try {
        const feesPerGas = await estimateFeesPerGas(config, { chainId })
        const gasEstimate = await estimateGas(config, {
            chainId,
            data: encodeFunctionData({ abi, functionName, args }),
            to,
            account,
            value
        })
        const gasLimit = (gasEstimate * 120n) / 100n // 上浮 20%
        return {
            gas: gasLimit,
            maxFeePerGas: feesPerGas.maxFeePerGas,
            maxPriorityFeePerGas: feesPerGas.maxPriorityFeePerGas
        }
    } catch (error) {
        console.error('Gas估算详细错误:', error)
        const msg = error.shortMessage || error.details || error.message
        if (msg.includes('insufficient funds')) throw new Error('账户余额不足以支付 Gas 费')
        if (msg.includes('transfer amount exceeds allowance')) throw new Error('授权额度不足')
        if (msg.includes('execution reverted')) throw new Error('合约执行被回退')
        throw new Error(`交易预检查失败: ${msg}`)
    }
}

// ================= 核心业务逻辑优化 =================

export async function getnativeBridgeFee({ currentChainId, bridgeContract, targetChainId }) {
    const chainId = Number(currentChainId)
    try {
        return await readContract(config, {
            chainId: chainId,
            address: bridgeContract,
            abi: BRIDGE_ABI,
            functionName: 'nativeBridgeFee',
            args: [safeBigInt(targetChainId)]
        })
    } catch (e) {
        console.error('获取跨链费失败', e)
        throw new Error('无法获取跨链费用')
    }
}

export async function checkOwnership({ currentChainId, localCollection, tokenId, address }) {
    try {
        const owner = await readContract(config, {
            chainId: Number(currentChainId),
            address: localCollection,
            abi: ERC721_ABI,
            functionName: 'ownerOf',
            args: [safeBigInt(tokenId)]
        })
        return owner.toLowerCase() === address.toLowerCase()
    } catch (e) {
        return false
    }
}

/**
 * ⚡️ 优化后的授权逻辑：使用 setApprovalForAll
 * 优势：一次 Gas，永久授权。后续操作无需再跑交易。
 */
export async function handleApprove({ currentChainId, bridgeContract, tokenId, localCollection, address }) {
    try {
        if (!address || !bridgeContract || !localCollection) throw new Error('参数缺失')

        const chainId = Number(currentChainId)
        await ensureCorrectChain(chainId)

        // 1. 检查所有权
        const isMine = await checkOwnership({ currentChainId, localCollection, tokenId, address })
        if (!isMine) throw new Error('操作失败：你不是该 NFT 的持有者')

        // 2. ✨ 优先检查【全量授权】 (isApprovedForAll)
        const isAllApproved = await readContract(config, {
            chainId: chainId,
            address: localCollection,
            abi: ERC721_ABI,
            functionName: 'isApprovedForAll',
            args: [address, bridgeContract] // owner, operator
        })

        if (isAllApproved) {
            console.log('已全量授权，跳过交易')
            return true 
        }

        // 3. (可选) 检查单次授权作为兜底
        const approvedAddress = await readContract(config, {
            chainId: chainId,
            address: localCollection,
            abi: ERC721_ABI,
            functionName: 'getApproved',
            args: [safeBigInt(tokenId)]
        })
        if (approvedAddress.toLowerCase() === bridgeContract.toLowerCase()) {
            return true
        }

        console.log('未授权，发起全量授权 (setApprovalForAll)...')

        // 4. 发起全量授权交易
        const args = [bridgeContract, true]
        const gasOptions = await computedGas(ERC721_ABI, 'setApprovalForAll', args, localCollection, address, 0n, chainId)

        const hash = await writeContract(config, {
            chainId: chainId,
            address: localCollection,
            abi: ERC721_ABI,
            functionName: 'setApprovalForAll',
            args: args,
            ...gasOptions
        })

        console.log(`授权交易发送: ${hash}`)
        
        // 授权必须等待上链，否则紧接着的 bridge 交易会因为额度不足失败
        const receipt = await waitForTransactionReceipt(config, { hash })
        
        if (receipt.status === 'success') {
            return true
        } else {
            throw new Error('授权交易失败')
        }
    } catch (error) {
        console.error('授权流程异常:', error)
        throw error
    }
}

/**
 *  优化后的跨链逻辑
 * 优化点：支持 waitForReceipt 参数，允许 "Fire and Forget" 模式
 */
export async function handleBridge({ 
    sourceChainId, 
    targetChainId, 
    localCollection, 
    remoteCollection, 
    bridgeContract, 
    tokenId, 
    address,
    waitForReceipt = false //  默认 false: 极速模式，不等待链上确认
}) {
    try {
        if (!bridgeContract || !localCollection || !remoteCollection) throw new Error('合约地址错误')

        const chainId = Number(sourceChainId)
        await ensureCorrectChain(chainId)

        // 1. 获取费用
        const feeValue = await getnativeBridgeFee({ currentChainId: sourceChainId, bridgeContract, targetChainId })

        const args = [
            safeBigInt(sourceChainId),
            safeBigInt(targetChainId),
            localCollection,
            remoteCollection,
            safeBigInt(tokenId),
            address
        ]

        // 2. 估算 Gas
        const gasOptions = await computedGas(BRIDGE_ABI, 'BridgeInitiateLocalNFT', args, bridgeContract, address, feeValue, chainId)

        // 3. 发送交易
        const hash = await writeContract(config, {
            chainId: chainId,
            address: bridgeContract,
            abi: BRIDGE_ABI,
            functionName: 'BridgeInitiateLocalNFT',
            args: args,
            value: feeValue,
            ...gasOptions
        })

        console.log(` 跨链请求已广播: ${hash}`)

        // 4. ✨ 极速返回逻辑
        if (!waitForReceipt) {
            // 直接告诉 UI 成功了，让区块链自己去跑
            return {
                success: true,
                hash: hash,
                status: 'pending' // 标记为处理中
            }
        }

        // 如果强制要等 (waitForReceipt = true)
        const receipt = await waitForTransactionReceipt(config, { hash })
        if (receipt.status === 'success') {
            return { success: true, hash, receipt }
        } else {
            throw new Error('跨链交易被回退')
        }

    } catch (error) {
        console.error('跨链失败:', error)
        if (error.code === 4001 || error.message.includes('rejected')) {
            throw new Error('用户取消了交易')
        }
        throw error
    }
}