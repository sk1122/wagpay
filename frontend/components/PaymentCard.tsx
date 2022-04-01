import { useRouter } from 'next/router'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useAccount, useConnect, useSignMessage } from 'wagmi'
import EthereumQRPlugin from 'ethereum-qr-code'
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import {
  createQR,
  encodeURL,
  findTransactionSignature,
  FindTransactionSignatureError,
  validateTransactionSignature,
} from '@solana/pay'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { ExternalProvider } from '@ethersproject/providers'
import {
  getAccount,
  getAssociatedTokenAddress,
  transfer,
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
} from '@solana/spl-token'
import toast from 'react-hot-toast'
import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'
import Authereum from 'authereum'

import { Switch } from '@headlessui/react'
import useTransactions from '../hooks/useTransactions'

const INFURA_ID = '460f40a260564ac4a4f4b3fffb032dad'

type supported_currencies = 'ethereum' | 'solana' | 'USDC (Ethereum)' | 'USDC (Solana)'

const currencies = [
	{
		symbol: 'ethereum',
		name: 'Ethereum',
		wallets: ['Metamask', 'WalletConnect', 'Coinbase Wallet']
	},
	{
		symbol: 'USDC (ETH)',
		name: 'USDC (Ethereum)',
		wallets: ['Metamask', 'WalletConnect', 'Coinbase Wallet']
	},
	{
		symbol: 'solana',
		name: 'Solana',
		wallets: ['Phantom']
	},
	{
		symbol: 'USDCSOL',
		name: 'USDC (Solana)',
		wallets: ['Phantom']
	}
]
interface Props {
  setIsModalOpen: Function
  setQrCode: Function
  merchantSOL: string
  merchantETH: string
  totalPrice: number
  fields: any[]
  storeId: number
  createTransaction: Function
  updateTransaction: Function
  setURL: Function
  accepted_currencies: any
  selectedProducts: any
}

const CrossIcon = () => {
  return (
    <svg
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
    >
      <path
        d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
        fill="currentColor"
        fill-rule="evenodd"
        clip-rule="evenodd"
      ></path>
    </svg>
  )
}

const PaymentCard = ({
  accepted_currencies,
  setURL,
  fields,
  createTransaction,
  updateTransaction,
  setIsModalOpen,
  merchantETH,
  merchantSOL,
  setQrCode,
  totalPrice,
  storeId,
  selectedProducts
}: Props) => {
  const { query } = useRouter()
	useEffect(() => {
		if(query && query.email) {
      console.log(query)
      setEmail(query.email as string)
    }
	}, [])

  const connectSOL = async () => {
    try {
      await window.solana.connect()
      setSOL(window.solana.publicKey.toString())
    } catch (e) {
      throw e
    }
  }

  const connectETH = async () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: INFURA_ID, // required
        },
      },
      authereum: {
        package: Authereum, // required
      },
    }

    const web3modal = new Web3Modal({
      providerOptions,
    })

    try {
      const provider = await web3modal.connect()
      console.log(provider, 'PROVIDER')
      return provider
    } catch (e) {
      throw e
    }
  }

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [eth, setETH] = useState('')
  const [sol, setSOL] = useState('')
  const [option, setOption] = useState<supported_currencies>(accepted_currencies[0])
  console.log(accepted_currencies)
  const [wallet, setWallet] = useState(currencies.find(currency => currency.name.toLowerCase() === accepted_currencies[0])?.wallets[0])
  const [price, setPrice] = useState(0)
  const [fieldValues, setFieldValues] = useState<any[]>(fields)

  useEffect(() => console.log(option, wallet), [option, wallet])

  const checkIfAllFilled = () => {
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].value) return false
    }

    return true
  }

  const qrCode = async () => {
    if (!email || !checkIfAllFilled()) {
      toast.error('Fill all Fields')
      return
    }

    if (totalPrice <= 0) {
      toast.error('Select a Product')
      return
    }
    if (option.toLowerCase() === 'ethereum') {
      const qr = new EthereumQRPlugin()
      const qrCode = await qr.toDataUrl(
        {
          to: merchantETH,
          value: 2,
        },
        {}
      )
      setQrCode(qrCode.dataURL)
    } else if (option.toLowerCase() === 'solana') {
      const connection = new Connection(clusterApiUrl('devnet'))

      console.log('2.  a customer checkout \n')
      console.log(merchantSOL)
      const recipient = new PublicKey(merchantSOL)
      console.log(price.toFixed(2))
      const amount = new BigNumber(price.toFixed(2))
      console.log(amount)
      const reference = new Keypair().publicKey
      const label = 'Jungle Cats store'
      const message = 'Jungle Cats store - your order - #001234'
      const memo = 'JC#4098'

      const url = encodeURL({
        recipient,
        amount,
        reference,
        label,
        message,
        memo,
      })

      // const qrCode = createQR(url);
      // console.log(qrCode)
      console.log(url)
      setURL(url)
      // setQrCode(qrCode._qr?.createDataURL())
      setIsModalOpen(true)

      console.log('\n5. Find the transaction')
      let signatureInfo

      const { signature } = await new Promise((resolve, reject) => {
        /**
         * Retry until we find the transaction
         *
         * If a transaction with the given reference can't be found, the `findTransactionSignature`
         * function will throw an error. There are a few reasons why this could be a false negative:
         *
         * - Transaction is not yet confirmed
         * - Customer is yet to approve/complete the transaction
         *
         * You can implement a polling strategy to query for the transaction periodically.
         */
        var a = false
        const interval = setInterval(async () => {
          console.count('Checking for transaction...')
          try {
            signatureInfo = await findTransactionSignature(
              connection,
              reference,
              undefined,
              'confirmed'
            )
            console.log('\n 🖌  Signature found: ', signatureInfo.signature, a)
            if(!a) {
              a = true;
              var txId = await createTransaction(email, fields, '', '', 'solana', signatureInfo.signature.toString(), storeId, selectedProducts, totalPrice)
              toast.success('Payment Successful')
              setIsModalOpen(false)
            }
            clearInterval(interval)
            resolve(signatureInfo)
          } catch (error: any) {
            if (!(error instanceof FindTransactionSignatureError)) {
              console.error(error)
              clearInterval(interval)
              reject(error)
            }
          }
        }, 250)
      })

      // Update payment status
      var paymentStatus = 'confirmed'

      /**
       * Validate transaction
       *
       * Once the `findTransactionSignature` function returns a signature,
       * it confirms that a transaction with reference to this order has been recorded on-chain.
       *
       * `validateTransactionSignature` allows you to validate that the transaction signature
       * found matches the transaction that you expected.
       */
      console.log('\n6. 🔗 Validate transaction \n')

      try {
        await validateTransactionSignature(
          connection,
          signature,
          recipient,
          amount,
          undefined,
          reference
        )

        // Update payment status
        paymentStatus = 'validated'
        // @ts-ignore
        // await updateTransaction(txId, true, signatureInfo?.signature)
      } catch (error) {
        console.error('❌ Payment failed', error)
      }
    } else if (option.toLowerCase() === 'usdc (ethereum)') {
    } else if (option.toLowerCase() === 'usdc (solana)') {
      const connection = new Connection(clusterApiUrl('devnet'))
      const splToken = new PublicKey(
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      )
      console.log('3. 💰 Create a payment request link \n')
      const recipient = new PublicKey(merchantSOL)
      const amount = new BigNumber(1)
      const reference = new Keypair().publicKey
      const label = 'Jungle Cats store'
      const message = 'Jungle Cats store - your order - #001234'
      const memo = 'JC#4098'
      const url = encodeURL({
        recipient,
        amount,
        splToken,
        reference,
        label,
        message,
        memo,
      })
      const qrCode = createQR(url)
      console.log(qrCode)
      setQrCode(qrCode._qr?.createDataURL())

      

      console.log('\n5. Find the transaction')
      let signatureInfo

      const { signature } = await new Promise((resolve, reject) => {
        /**
         * Retry until we find the transaction
         *
         * If a transaction with the given reference can't be found, the `findTransactionSignature`
         * function will throw an error. There are a few reasons why this could be a false negative:
         *
         * - Transaction is not yet confirmed
         * - Customer is yet to approve/complete the transaction
         *
         * You can implement a polling strategy to query for the transaction periodically.
         */
        var a = false
        const interval = setInterval(async () => {
          console.count('Checking for transaction...')
          try {
            signatureInfo = await findTransactionSignature(
              connection,
              reference,
              undefined,
              'confirmed'
            )
            console.log('\n 🖌  Signature found: ', signatureInfo.signature, a)
            if(!a) {
              a = true; 
              var txId = await createTransaction(email, fields, '', '', 'SOL', signatureInfo.signature.toString(), storeId, selectedProducts, totalPrice)
              toast.success('Payment Successful')
              setIsModalOpen(false)
            }
            clearInterval(interval)
            resolve(signatureInfo)
          } catch (error: any) {
            if (!(error instanceof FindTransactionSignatureError)) {
              console.error(error)
              clearInterval(interval)
              reject(error)
            }
          }
        }, 250)
      })

      // Update payment status
      var paymentStatus = 'confirmed'

      /**
       * Validate transaction
       *
       * Once the `findTransactionSignature` function returns a signature,
       * it confirms that a transaction with reference to this order has been recorded on-chain.
       *
       * `validateTransactionSignature` allows you to validate that the transaction signature
       * found matches the transaction that you expected.
       */
      console.log('\n6. 🔗 Validate transaction \n')

      try {
        await validateTransactionSignature(
          connection,
          signature,
          recipient,
          amount,
          undefined,
          reference
        )

        // Update payment status
        paymentStatus = 'validated'
         // @ts-ignore
        // await updateTransaction(txId, true, signatureInfo?.signature)
      } catch (error) {
        console.error('❌ Payment failed', error)
      }
    }
  }

  const pay = async () => {
    // e.preventDefault()
    if (!email || !checkIfAllFilled()) {
      toast.error('Fill all Fields')
      return
    }

    if (totalPrice <= 0) {
      toast.error('Select a Product')
      return
    }

    if (option.toLowerCase() === 'solana') {
      var toastIdTransact
      try {
        const toastIdConnect = toast.loading('Connecting Solana Wallet')
        try {
          await connectSOL()
        } catch (e) {
          toast.dismiss(toastIdConnect)
          toast.error('Solana Wallet Not Connected')
          return
        }
        const solProvider = window.solana
        const solConnection = new Connection(clusterApiUrl('devnet'))
        toast.dismiss(toastIdConnect)
        toast.success('Successfully Connected Phantom')

        toastIdTransact = toast.loading('Creating Solana Transaction')
        var transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: solProvider.publicKey,
            toPubkey: new PublicKey(merchantSOL),
            lamports: price * LAMPORTS_PER_SOL,
          })
        )

        transaction.feePayer = await solProvider.publicKey
        let blockhashObj = await solConnection.getRecentBlockhash()
        transaction.recentBlockhash = await blockhashObj.blockhash

        if (transaction) {
          console.log('Txn created successfully')
        }

        let signed = await solProvider.signTransaction(transaction)

        let signature = await solConnection.sendRawTransaction(
          signed.serialize()
        )
        await solConnection.confirmTransaction(signature)
        console.log(totalPrice, "totalPrice")
        var txId = await createTransaction(
          email,
          fields,
          '',
          solProvider.publicKey.toString(),
          'solana',
          signature,
          storeId, 
          selectedProducts,
          totalPrice
        )
        toast.dismiss(toastIdTransact)
        toast.success('Successfully Sent Transaction')

        return signature
      } catch (e) {
        console.log(e)
        toast.dismiss(toastIdTransact)
        toast.error('Transaction not successful')
      }
    } else if (option.toLowerCase() === 'ethereum') {
      var toastTransact, toastConnect

      toastConnect = toast.loading('Connecting Ethereum Wallet')
      try {
        var pr = await connectETH()
        console.log(pr)
      } catch (e) {
        toast.dismiss(toastConnect)
        toast.error("Can't connect to Wallet")
        return
      }
      const ethProvider = new ethers.providers.Web3Provider(pr)
      const signer = ethProvider.getSigner()
      const address = await signer.getAddress()
      setETH(address)
      toast.dismiss(toastConnect)
      toast.success('Successfully Connected to ' + wallet)

      toastTransact = toast.loading('Creating Ethereum Transaction')

      try {
        const tx = await signer.sendTransaction({
          to: merchantETH,
          value: ethers.utils.parseEther(price.toFixed(5)),
        })

        var txId = await createTransaction(email, fields, address, '', 'ethereum', tx.hash, storeId, selectedProducts, totalPrice)
        toast.dismiss(toastTransact)
        toast.success('Successfully sent Transaction')
        return tx
      } catch (e) {
        toast.dismiss(toastTransact)
        toast.error('Transaction not successful')
        console.log("WagPay: Can't send transaction!", e)
      }
    } else if (option.toLowerCase() === 'usdc (ethereum)') {
      var toastTransact, toastConnect
      try {
        toastConnect = toast.loading('Connecting Ethereum Wallet')
        try {
          var pr = await connectETH()
          console.log(pr)
        } catch (e) {
          toast.dismiss(toastConnect)
          toast.error("Can't connect to Wallet")
          return
        }
        const ethProvider = new ethers.providers.Web3Provider(pr)
        const signer = ethProvider.getSigner()
        const address = await signer.getAddress()
        setETH(address)
        toast.dismiss(toastConnect)
        toast.success('Successfully Connected to ' + wallet)

        toastTransact = toast.loading('Creating Ethereum Transaction')

        let erc20abi = [
          'function transfer(address to, uint amount) returns (bool)',
        ]
        let erc20contract = new ethers.Contract(
          '0xF61Cffd6071a8DB7cD5E8DF1D3A5450D9903cF1c',
          erc20abi,
          signer
        )
        let tx = await erc20contract.transfer(
          merchantETH,
          ethers.utils.parseUnits(price.toString(), 6)
        )

        toast.dismiss(toastTransact)
        toast.success('Created Transaction')

        toastTransact = toast.loading('Waiting for Ethereum Transaction')
        await tx.wait()
        toast.dismiss(toastTransact)
        toast.success('Transaction Succesful')
        var txId = await createTransaction(email, fields, address, '', 'usdceth', tx.hash, storeId, selectedProducts, totalPrice)
        console.log(tx)
      } catch (e) {
        toast.dismiss(toastTransact)
        toast.error("Can't Transact")
      }
    } else if (option.toLowerCase() == 'usdc (solana)') {
      const toastIdConnect = toast.loading('Connecting Solana Wallet')
      try {
        await connectSOL()
      } catch (e) {
        toast.dismiss(toastIdConnect)
        toast.error('Solana Wallet Not Connected')
        return
      }
      const solProvider = window.solana
      const solConnection = new Connection(clusterApiUrl('devnet'))
      toast.dismiss(toastIdConnect)
      toast.success('Successfully Connected Phantom')

      toastIdTransact = toast.loading('Creating Solana Transaction')

      const tokenAccount = await getAssociatedTokenAddress(
        new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        solProvider.publicKey
      )

      const tokenAccountInfo = await getAccount(solConnection, tokenAccount)
      console.log(merchantSOL)

      const merchantTokenAccount = await getAssociatedTokenAddress(
        new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        new PublicKey(merchantSOL)
      )

      const merchantTokenAccountInfo = await getAccount(
        solConnection,
        merchantTokenAccount
      )

      console.log(tokenAccountInfo)

      const instructions: TransactionInstruction = createTransferInstruction(
        tokenAccountInfo.address,
        merchantTokenAccountInfo.address,
        solProvider.publicKey,
        1,
        [],
        TOKEN_PROGRAM_ID
      )

      const transaction = new Transaction().add(instructions)
      transaction.feePayer = solProvider.publicKey
      transaction.recentBlockhash = (
        await solConnection.getRecentBlockhash()
      ).blockhash
      let signed = await solProvider.signTransaction(transaction)

      const transactionSignature = await solConnection.sendRawTransaction(
        signed.serialize()
      )

      await solConnection.confirmTransaction(transactionSignature)
      
      const tx = await createTransaction(email, fields, '', solProvider.publicKey, 'usdcsol', transactionSignature, storeId, selectedProducts, totalPrice)

      toast.dismiss(toastIdTransact)
    }
  }

  useEffect(() => {
    if (option.toLowerCase() == 'ethereum') {
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      )
        .then((data) => data.json())
        .then((res) => setPrice(totalPrice / Number(res.ethereum.usd)))
    } else if (option.toLowerCase() == 'solana') {
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
      )
        .then((data) => data.json())
        .then((res) => setPrice(totalPrice / Number(res.solana.usd)))
    } else {
      setPrice(totalPrice)
    }
  }, [totalPrice, option])

  const changeField = (idx: number, value: any) => {
    setFieldValues((previousState) => {
      let values = [...fieldValues]
      values[idx].value = value
      return values
    })
  }

  useEffect(() => {
    console.log(fieldValues, 'fieldValues')
  }, [fieldValues])

  const [agreed, setAgreed] = useState(false)

  return (
    // <div className="flex h-full w-full flex-col items-center justify-center space-y-10 font-urban lg:w-1/2 lg:items-end">
    //   <div className="relative mt-10 flex h-[545px] w-[300px] flex-col items-center justify-center overflow-hidden rounded-xl font-urban shadow-xl xl:w-[449px]">
    //     <div className="absolute -top-20 -left-36 -z-50 h-96 w-96 select-none rounded-full bg-[#FFA8D5]/50 blur-3xl"></div>
    //     <div className="absolute -bottom-20 -right-36 -z-50 h-96 w-96 select-none rounded-full bg-[#6C7EE1]/50 blur-3xl"></div>
    //     <div className="flex h-full w-full flex-col items-center justify-center space-y-5 p-5">
    //       <h1 className="text-2xl font-bold">WagPay</h1>
    //       <div className="flex w-full justify-between rounded-xl bg-white  opacity-80">
    //         <input
    //           value={email}
    //           onChange={(e) => setEmail(e.target.value)}
    //           type="email"
    //           placeholder="Email"
    //           className="w-full rounded-xl border-0 py-4 pl-4 text-sm font-semibold opacity-80 outline-none"
    //           required
    //         />
    //       </div>
    //       {fields.map((value, idx) => (
    //         <div className="flex w-full justify-between rounded-xl bg-white  opacity-80">
    //           <input
    //             value={fieldValues[idx].value}
    //             onChange={(e) => changeField(idx, e.target.value)}
    //             type={value.type}
    //             placeholder={value.name}
    //             className="w-full rounded-xl border-0 py-4 pl-4 text-sm font-semibold opacity-80 outline-none"
    //             required
    //           />
    //         </div>
    //       ))}
    //   <div className="flex w-full justify-between">
    //     <select
    //       className="form-select block
    // 				w-1/3
    // 				appearance-none
    // 				rounded-xl
    // 				border
    // 				border-solid
    // 				border-gray-300
    // 				bg-white
    // 				bg-clip-padding bg-no-repeat px-3
    // 				py-1.5 text-base font-normal
    // 				text-gray-700
    // 				transition
    // 				ease-in-out
    // 				focus:border-blue-600 focus:bg-white focus:text-gray-700 focus:outline-none"
    //       aria-label="Default select example"
    //       onChange={(e) =>
    //         setOption(e.target.value as supported_currencies)
    //       }
    //     >
    //       {Object.keys(currencies[0]).map((currency) => {
    //         return <option value={currency}>{currency}</option>
    //       })}
    //     </select>

    //     <select
    //       className="form-select block
    // 				w-1/3
    // 				appearance-none
    // 				rounded-xl
    // 				border
    // 				border-solid
    // 				border-gray-300
    // 				bg-white
    // 				bg-clip-padding bg-no-repeat px-3
    // 				py-1.5 text-base font-normal
    // 				text-gray-700
    // 				transition
    // 				ease-in-out
    // 				focus:border-blue-600 focus:bg-white focus:text-gray-700 focus:outline-none"
    //       aria-label="Default select example"
    //       onChange={(e) =>
    //         setWallet(e.target.value as supported_currencies)
    //       }
    //     >
    //       {currencies[0][option as supported_currencies].wallets.map(
    //         (value) => {
    //           return <option value={value}>{value}</option>
    //         }
    //       )}
    //     </select>
    //   </div>
    //       <div className="flex w-full items-center justify-between">
    //         <div className="flex items-center justify-center space-x-2">
    //           <p>${totalPrice}</p>
    //           <p>
    //             ~{price.toFixed(2)}{' '}
    //             {option.toLowerCase() === 'ethereum'
    //               ? 'ETH'
    //               : option.toLowerCase() === 'solana'
    //               ? 'SOL'
    //               : 'USDC'}
    //           </p>
    //         </div>
    //         {option.toLowerCase() === 'solana' && (
    //           <div
    //             onClick={() => qrCode()}
    //             className="h-10 w-10 cursor-pointer rounded-xl"
    //           >
    //             <img
    //               src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png"
    //               alt=""
    //               className="h-full w-full"
    //             />
    //           </div>
    //         )}
    //         {/* <div ref={ref}></div> */}
    //       </div>
    //       <button
    //         onClick={pay}
    //         className="w-full rounded-xl bg-gradient-to-tr from-[#4B74FF] to-[#9281FF] py-3 text-sm text-white"
    //       >
    //         Pay
    //       </button>
    //     </div>
    //   </div>
    // </div>
    <>
      <div className="overflow-hidden h-full w-full overflow-hidden rounded-xl bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 lg:py-14">
        <div className="relative min-w-full">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              WagPay
            </h2>
          </div>
          <div className="mt-12">
            <div
              className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8"
            >
              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                {fields.map((value, idx) => (
                  <>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {value.name}
                    </label>

                    <input
                      value={fieldValues[idx].value}
                      onChange={(e) => changeField(idx, e.target.value)}
                      type={value.type}
                      className="block w-full rounded-md border-gray-300 py-3 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </>
                ))}
              </div>

              {/* ------------------------------- */}
              <div className="mt-1 -space-y-px rounded-md shadow-sm">
                <select
                  className="relative block w-full rounded-md border-gray-300 bg-transparent focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-label="Default select example"
                  value={option}
                  onChange={(e) =>
                    setOption(e.target.value as supported_currencies)
                  }
                >
                  {currencies.map(currency => {
                    if(!accepted_currencies.includes(currency.symbol)) return <div></div>
                    return <option value={currency.symbol}>{currency.name}</option>	
                  })}
                </select>
              </div>
              <div className="mt-1 -space-y-px rounded-md shadow-sm">
                <select
                  className="relative block w-full rounded-md border-gray-300 bg-transparent focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-label="Default select example"
                  onChange={(e) =>
                    setWallet(e.target.value as supported_currencies)
                  }
                >
                  {currencies.find(currency => currency.symbol === option as supported_currencies)?.wallets.map(value => {
                    return <option value={value}>{value}</option>
                  })}
                </select>
              </div>
              {/* ------------------------------- */}

              <div className="flex w-full items-center justify-between md:col-span-2">
                {' '}
                <div className="flex items-center justify-center space-x-2">
                  <p>${totalPrice}</p>{' '}
                  <p>
                    ~{price.toFixed(2)}{' '}
                    {console.log(option.toLowerCase() === 'solana')}
                    {option.toLowerCase() === 'ethereum'
                      ? 'ETH'
                      : option.toLowerCase() === 'solana'
                      ? 'SOL'
                      : 'USDC'}
                  </p>
                </div>
                {option.toLowerCase() === 'solana' && (
                  <div
                    onClick={() => qrCode()}
                    className="cursor-pointer rounded-md bg-black px-3 py-2 text-white"
                  >
                    <svg width="60" height="22" viewBox="0 0 60 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M53.7996 15.3534L50.3357 7.78491H47.4607L52.4091 17.997L52.32 18.3045C52.1961 18.7132 51.9345 19.0662 51.5798 19.3032C51.2252 19.5402 50.7995 19.6465 50.3753 19.6039C49.8788 19.5993 49.3917 19.4679 48.9601 19.222L48.4999 21.4093C49.164 21.6836 49.8747 21.8267 50.5931 21.8308C52.5724 21.8308 53.7699 21.1017 54.7596 18.9542L60 7.78491H57.2239L53.7996 15.3534Z" fill="white"/>
                      <path d="M29.3187 4.1792H21.0153V18.0912H23.7369V12.9777H29.3187C32.3521 12.9777 34.3463 11.4452 34.3463 8.57847C34.3463 5.71175 32.3521 4.1792 29.3187 4.1792ZM29.1702 10.5425H23.727V6.57474H29.1702C30.7438 6.57474 31.6445 7.2939 31.6445 8.55863C31.6445 9.82336 30.7438 10.5425 29.1702 10.5425Z" fill="white"/>
                      <path d="M45.7249 15.4526V11.2617C45.7249 8.78182 43.9484 7.49725 40.9002 7.49725C38.426 7.49725 36.2586 8.65287 35.6499 10.4284L37.8866 11.222C38.2182 10.3342 39.3711 9.67953 40.8062 9.67953C42.5084 9.67953 43.226 10.3739 43.226 11.222V11.4948L39.1782 11.9412C36.8475 12.1891 35.3134 13.2356 35.3134 15.1055C35.3134 17.1538 37.0701 18.2549 39.4008 18.2549C40.9031 18.3018 42.3661 17.7692 43.4882 16.767C43.894 17.7589 44.3097 18.4235 47.0758 18.0714V15.9982C45.9674 16.266 45.7249 15.9982 45.7249 15.4526ZM43.2507 14.1234C43.2507 15.4725 41.3654 16.1867 39.7868 16.1867C38.5843 16.1867 37.8619 15.7998 37.8619 15.0311C37.8619 14.2623 38.4557 13.9846 39.6037 13.8506L43.2606 13.4241L43.2507 14.1234Z" fill="white"/>
                      <path d="M15.8678 14.8277C15.8871 14.8856 15.8871 14.9483 15.8678 15.0062C15.8566 15.064 15.8292 15.1174 15.7886 15.16L13.1709 17.9126C13.1132 17.9721 13.0442 18.0193 12.968 18.0515C12.8916 18.0851 12.809 18.102 12.7256 18.1011H0.309983C0.252484 18.1016 0.195969 18.0862 0.146685 18.0565C0.0974336 18.0229 0.0581183 17.9766 0.0328714 17.9226C0.015435 17.8677 0.015435 17.8088 0.0328714 17.7539C0.0431328 17.6968 0.0688042 17.6437 0.107097 17.6002L2.72976 14.8475C2.78744 14.7881 2.85643 14.7409 2.93264 14.7087C3.00891 14.6747 3.09166 14.6577 3.17512 14.6591H15.5709C15.6307 14.6579 15.6895 14.6752 15.7391 14.7087C15.7948 14.7317 15.8405 14.7739 15.8678 14.8277ZM13.1759 9.60015C13.1169 9.54228 13.0482 9.49527 12.973 9.46128C12.8958 9.43008 12.8137 9.41328 12.7305 9.41168H0.309983C0.251765 9.41254 0.194951 9.42972 0.145975 9.46127C0.0969987 9.49283 0.057818 9.5375 0.0328714 9.59023C0.0157557 9.64513 0.0157557 9.70396 0.0328714 9.75886C0.0412052 9.81656 0.0671307 9.87026 0.107097 9.91261L2.72976 12.6702C2.78873 12.7281 2.8574 12.7751 2.93264 12.8091C3.00965 12.8407 3.0919 12.8575 3.17512 12.8587H15.5709C15.6307 12.8598 15.6895 12.8425 15.7391 12.8091C15.7891 12.7799 15.8275 12.7344 15.848 12.6801C15.8734 12.6274 15.8818 12.568 15.872 12.5103C15.8623 12.4525 15.8349 12.3992 15.7936 12.3578L13.1759 9.60015ZM0.146685 7.56667C0.195969 7.59636 0.252484 7.6118 0.309983 7.6113H12.7305C12.8139 7.61217 12.8966 7.59527 12.973 7.56171C13.0492 7.52948 13.1182 7.48226 13.1759 7.42284L15.7936 4.67019C15.8341 4.6276 15.8616 4.57423 15.8728 4.51644C15.8899 4.46154 15.8899 4.40271 15.8728 4.34781C15.8523 4.29359 15.8139 4.24807 15.7639 4.21886C15.7142 4.18544 15.6555 4.16812 15.5956 4.16926H3.15532C3.07186 4.16793 2.98912 4.18485 2.91285 4.21886C2.83664 4.25109 2.76765 4.29831 2.70997 4.35773L0.0922528 7.12029C0.0507444 7.16218 0.0231013 7.21586 0.0130773 7.27404C-0.00435908 7.3289 -0.00435908 7.38782 0.0130773 7.44267C0.0451946 7.49569 0.0914761 7.53864 0.146685 7.56667Z" fill="url(#paint0_linear_306_215)"/>
                      <defs>
                      <linearGradient id="paint0_linear_306_215" x1="1.34093" y1="18.4332" x2="14.0922" y2="3.77438" gradientUnits="userSpaceOnUse">
                      <stop offset="0.08" stop-color="#9945FF"/>
                      <stop offset="0.3" stop-color="#8752F3"/>
                      <stop offset="0.5" stop-color="#5497D5"/>
                      <stop offset="0.6" stop-color="#43B4CA"/>
                      <stop offset="0.72" stop-color="#28E0B9"/>
                      <stop offset="0.97" stop-color="#19FB9B"/>
                      </linearGradient>
                      </defs>
                    </svg>

                  </div>
                )}
                {/* <div ref={ref}></div> */}
              </div>
              {/* ------------------------------- */}

              <div className="sm:col-span-2">
                <button
                  onClick={pay}
                  className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PaymentCard
