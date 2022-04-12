import { createQR, encodeURL, findTransactionSignature, FindTransactionSignatureError, validateTransactionSignature } from "@solana/pay"
import useTransactions from "../../../hooks/useTransactions"
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js"
import WalletConnectProvider from "@walletconnect/web3-provider"
import { ethers } from "ethers"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import Authereum from 'authereum'
import Web3Modal from 'web3modal'
import toast from "react-hot-toast"
import BigNumber from "bignumber.js"
import {
  getAccount,
  getAssociatedTokenAddress,
  transfer,
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
} from '@solana/spl-token'

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

const updateIntent = async (intent_data: object) => {
  const data = await fetch(`http://localhost:2000/api/paymentIntents/`, {
    method: 'PATCH',
    body: JSON.stringify(intent_data),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if(data.status >= 400) toast.error("Can't talk with backend")
}

export const getServerSideProps = async (context: any) => {
	const data = await fetch(`http://localhost:2000/api/paymentIntents/${context.params.id}`)
	if(data.status == 400) {
		return {
			props: {
				intent: {}
			}
		}
	}

	const res = await data.json()

  console.log(res, "RS")

	return {
		props: {
			intent: res
		}
	}
}

interface Props {
	intent: any
}

const Intent = ({ intent }: Props) => {
	console.log(intent, "INTENT")
  const [transactions, getTransactions, createTransaction] = useTransactions()

	const { query } = useRouter()
	useEffect(() => {
		if(query && query.email) {
      console.log(query)
      setEmail(query.email as string)
    }
	}, [])

  const [tooltipStatus, setTooltipStatus] = useState(0);
  const [ethGas, setEthGas] = useState<any>()
  const [solGas, setSolGas] = useState<any>()

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
      return provider
    } catch (e) {
      throw e
    }
  }

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [eth, setETH] = useState('')
  const [sol, setSOL] = useState('')
  const [option, setOption] = useState<supported_currencies>(intent.page.accepted_currencies[0])
  const [wallet, setWallet] = useState(currencies.find(currency => currency.name.toLowerCase() === intent.page.accepted_currencies[0])?.wallets[0])
  const [price, setPrice] = useState(0)
  const [fieldValues, setFieldValues] = useState<any[]>(intent.page.fields)

  useEffect(() => console.log(option, wallet), [option, wallet])

  const checkIfAllFilled = () => {
    for (let i = 0; i < intent.page.fields.length; i++) {
      if (!intent.page.fields[i].value) return false
    }

    return true
  }

  const qrCode = async () => {
    if (!email || !checkIfAllFilled()) {
      toast.error('Fill all Fields')
      return
    }

    if (intent.value <= 0) {
      toast.error('Select a Product')
      return
    }
    if (option.toLowerCase() === 'solana') {
      const connection = new Connection(clusterApiUrl('devnet'))

      console.log('2.  a customer checkout \n')
      console.log(intent.page.sol_address)
      const recipient = new PublicKey(intent.page.sol_address)
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
      // setURL(url)
      // setQrCode(qrCode._qr?.createDataURL())
      // setIsModalOpen(true)

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
              var txId = await createTransaction(email, intent.page.fields, '', '', 'solana', signatureInfo.signature.toString(), intent.page.id, [], intent.value)
              updateIntent({
                id: intent.id,
                is_paid: true,
                transaction_hash: signatureInfo.signature.toString(),
                from_email: email
              })
              toast.success('Payment Successful')
              // setIsModalOpen(false)
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
      const recipient = new PublicKey(intent.page.sol_address)
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
      // setQrCode(qrCode._qr?.createDataURL())

      

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
              var txId = await createTransaction(email, intent.page.fields, '', '', 'SOL', signatureInfo.signature.toString(), intent.page.id, [], intent.value)
              updateIntent({
                id: intent.id,
                is_paid: true,
                transaction_hash: signatureInfo.signature.toString(),
                from_email: email
              })
              toast.success('Payment Successful')
              // setIsModalOpen(false)
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

    if (intent.value <= 0) {
      toast.error('Select a Product')
      return
    }

    if (option.toLowerCase() === 'solana') {
      console.log('soolsoll')
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
            toPubkey: new PublicKey(intent.page.sol_address),
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
        console.log(intent.value, "totalPrice")
        var txId = await createTransaction(
          email,
          intent.page.fields,
          '',
          solProvider.publicKey.toString(),
          'solana',
          signature,
          intent.page.id, 
          [],
          intent.value
        )
        updateIntent({
          id: intent.id,
          is_paid: true,
          transaction_hash: signature,
          from_email: email
        })
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
        console.log(intent.page)
        const tx = await signer.sendTransaction({
          to: intent.page.eth_address,
          value: ethers.utils.parseEther(price.toFixed(5)),
        })

        var txId = await createTransaction(email, intent.page.fields, address, '', 'ethereum', tx.hash, intent.page.id, [], intent.value)
        updateIntent({
          id: intent.id,
          is_paid: true,
          transaction_hash: tx.hash,
          from_email: email
        })
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
          intent.page.eth_address,
          ethers.utils.parseUnits(price.toString(), 6)
        )

        toast.dismiss(toastTransact)
        toast.success('Created Transaction')

        toastTransact = toast.loading('Waiting for Ethereum Transaction')
        await tx.wait()
        toast.dismiss(toastTransact)
        toast.success('Transaction Succesful')
        var txId = await createTransaction(email, intent.page.fields, address, '', 'usdceth', tx.hash, intent.page.id, [], intent.value)
        updateIntent({
          id: intent.id,
          is_paid: true,
          transaction_hash: tx.hash,
          from_email: email
        })
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
      console.log(intent.page.sol_address)

      const merchantTokenAccount = await getAssociatedTokenAddress(
        new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        new PublicKey(intent.page.sol_address) 
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
      
      const tx = await createTransaction(email, intent.page.fields, '', solProvider.publicKey, 'usdcsol', transactionSignature, intent.page.id, [], intent.value)
      updateIntent({
        id: intent.id,
        is_paid: true,
        transaction_hash: transactionSignature,
        from_email: email
      })

      toast.dismiss(toastIdTransact)
    }
  }

  useEffect(() => {
    if (option.toLowerCase() == 'ethereum') {
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      )
        .then((data) => data.json())
        .then((res) => setPrice(intent.value / Number(res.ethereum.usd)))
    } else if (option.toLowerCase() == 'solana') {
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
      )
        .then((data) => data.json())
        .then((res) => setPrice(intent.value / Number(res.solana.usd)))
    } else {
      setPrice(intent.value)
    }
  }, [intent.value, option])

  useEffect(() => {
    (async () => {
      const provider = new ethers.providers.InfuraProvider(1, INFURA_ID)
      const gas = await provider.estimateGas({
        to: '0x4e7f624C9f2dbc3bcf97D03E765142Dd46fe1C46',
        value: ethers.utils.parseEther(price.toString())
      })
      const ethgas = ethers.utils.formatUnits(gas.toString(), 9)
      console.log(ethgas)
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      )
        .then((data) => data.json())
        .then((res) => setEthGas(Number(ethgas) * Number(res.ethereum.usd)))
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
      )
          .then((data) => data.json())
          .then((res) => setSolGas(0.00005 * Number(res.solana.usd)))
    })()
  }, [intent.value])

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

	return (
		<div className='w-full min-h-screen flex justify-center items-center bg-[#09101A] font-inter'>
			<div className="w-1/3 h-full flex justify-center items-center flex-col bg-[#141C28] border-2 border-white/20 p-10 text-white rounded-xl">
				<h1 className="font-jakarta text-4xl">WagPay</h1>
				<div className="w-full p-5 space-y-4">
					<input 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="sk1122@wagpay.xyz" 
            type="email" 
            name="email" 
            className="border border-white/20 p-2 w-full text-white bg-transparent" />
					{intent.page.fields.map((value: any, idx: number) => (
						<input
              value={fieldValues[idx].value}
              onChange={(e) => changeField(idx, e.target.value)}
							placeholder={value.name}
							type={value.type}
							className="p-2 w-full text-white bg-transparent border border-white/20"
							required
						/>
					))}
				</div>

				<div className="w-full px-5 flex justify-between items-center">
					<select
						className="relative block w-1/2 rounded-md border-gray-300 bg-transparent focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						aria-label="Default select example"
						value={option}
						onChange={(e) =>
							setOption(e.target.value as supported_currencies)
						}
					>
						{currencies.map(currency => {
							if(!intent.page.accepted_currencies.includes(currency.symbol)) return <div></div>
							return <option value={currency.symbol}>{currency.name}</option>	
						})}
					</select>
					<div>
						<h2 className="font-bold text-xl">${intent.value} {' '} ~{price.toFixed(2)} 
            {' '}{option.toLowerCase() === 'ethereum'
                      ? 'ETH'
                      : option.toLowerCase() === 'solana'
                      ? 'SOL'
                      : 'USDC'}</h2>
					</div>
				</div>

				<div className="w-full p-5">
					<button onClick={() => pay()} className="w-full rounded-xl text-xl font-bold tracking-wider p-5 bg-gradient-to-r from-[#3C43EE] to-[#5055DA]">
						PAY
					</button>
				</div>
			</div>
		</div>
	)
}

export default Intent