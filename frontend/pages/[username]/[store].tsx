import Product from '../../components/Product'
import PaymentCard from '../../components/PaymentCard'
import { ChangeEvent, useLayoutEffect, useRef, useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '../../supabase'
import { useRouter } from 'next/router'
import { Product as ProductInterface } from '../api/product'
import QRCodeStyling, {
  DrawType,
  TypeNumber,
  Mode,
  ErrorCorrectionLevel,
  DotType,
  CornerSquareType,
  CornerDotType,
  Options,
} from 'qr-code-styling'

import {
  CheckIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  XIcon as XIconSolid,
} from '@heroicons/react/solid'

interface Page {
  id: number
  title: string
  logo: string
  description: string
  social_links: Object
  accepted_currencies: string[]
  terms_conditions: string[]
  slug: string
  eth_address?: string
  sol_address?: string
  user: number
  products: ProductInterface[]
  fields: any[]
}

interface Props {
  store: Page
}

const products = [
  {
    id: 1,
    name: 'Ray96',
    href: '#',
    price: '$32.00',
    inStock: true,
  },

  {
    id: 2,
    name: 'Ray69',
    href: '#',
    price: '$32.00',
    inStock: true,
  },
]
export const getServerSideProps = async (context: any) => {
  try {
    const res = await fetch(
      `http://localhost:3000/api/pages/${context.params.store}?username=${context.params.username}`
    )
    console.log(
      `http://localhost:3000/api/pages/${context.params.store}?username=${context.params.username}`
    )
    const store: Page = await res.json()
    return {
      props: {
        store: store,
      },
    }
  } catch (e) {
    return {
      redirect: {
        permanent: false,
        destination: `/claim?username=${context.params.store}`,
      },
    }
  }
}

const Store = ({ store }: Props) => {
  const { query } = useRouter()

  const updateVisit = async () => {
    console.log(store.id)
    let data = await fetch(
      `http://localhost:3000/api/pages/updateVisits?id=${store.id}`,
      {
        method: 'PATCH',
      }
    )
  }

  useEffect(() => {
    updateVisit()
  }, [])

  useEffect(() => {
    if (query.products) {
      const products = query.products as string[]
      ;(async () => {
        let ids: ProductInterface[] = []
        const promise = await products.map(async (v) => {
          let data = await fetch(`http://localhost:3000/api/products/${v}`)
          let product = (await data.json()) as ProductInterface
          console.log(product)
          ids.push(product)
        })
        await Promise.all(promise)
        addNewProduct(ids)
      })()
    }
  }, [])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [qrCode, setQrCode] = useState(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png'
  )
  const [selectedProducts, setSelectedProducts] = useState<ProductInterface[]>(
    []
  )
  const [totalPrice, setTotalPrice] = useState(0)
  const [url, setUrl] = useState('https://qr-code-styling.com')

  useEffect(() => console.log(qrCode), [qrCode])

  const addNewProduct = async (productId: ProductInterface[]) => {
    let unique: ProductInterface[] = [...selectedProducts, ...productId]

    let totalValue = 0
    const promise = await unique.map(
      (value) => (totalValue += value.discounted_price)
    )
    await Promise.all(promise)
    setTotalPrice(totalValue)
    setSelectedProducts(unique)
  }

  useEffect(() => console.log(selectedProducts), [selectedProducts])

  const removeProduct = async (productId: ProductInterface[]) => {
    let unique: ProductInterface[] = selectedProducts
    for (let i = 0; i < unique.length; i++) {
      if (unique[i].id === productId[0].id) {
        unique.splice(i, 1)
        break
      }
    }
    console.log(unique)
    let totalValue = 0
    const promise = await unique.map(
      (value) => (totalValue += value.discounted_price)
    )
    await Promise.all(promise)
    setTotalPrice(totalValue)
    setSelectedProducts(unique)
  }

  const createTransaction = async (
    email: string,
    fields: any,
    eth: string,
    sol: string
  ) => {
    const transaction = {
      email: email,
      fields: fields,
      eth_address: eth,
      sol_address: sol,
      page_id: store.id,
      products: selectedProducts.map((value) => value.id),
    }

    const data = await fetch('/api/submissions/create', {
      method: 'POST',
      body: JSON.stringify(transaction),
    })
    const res = await data.json()

    return res.id
  }

  const updateTransaction = async (
    transactionId: number,
    successful: boolean,
    transactionHash: string
  ) => {
    const transaction = {
      id: transactionId,
      transaction_hash: transactionHash,
    }
    console.log(transaction)
    const data = await fetch('/api/submissions/update', {
      method: 'POST',
      body: JSON.stringify(transaction),
    })
    const res = await data.json()

    console.log(res)
  }

  const [options, setOptions] = useState<Options>({
    width: 300,
    height: 300,
    type: 'svg' as DrawType,
    data: '',
    image: '/spay.svg',
    margin: 10,
    qrOptions: {
      typeNumber: 0 as TypeNumber,
      mode: 'Byte' as Mode,
      errorCorrectionLevel: 'Q' as ErrorCorrectionLevel,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.3,
      margin: 10,
      crossOrigin: 'anonymous',
    },
    dotsOptions: {
      color: '#222222',
      // gradient: {
      //   type: 'linear', // 'radial'
      //   rotation: 0,
      //   colorStops: [{ offset: 0, color: '#8688B2' }, { offset: 1, color: '#77779C' }]
      // },
      type: 'rounded' as DotType,
    },
    backgroundOptions: {
      color: '#fff',
      // gradient: {
      //   type: 'linear', // 'radial'
      //   rotation: 0,
      //   colorStops: [{ offset: 0, color: '#ededff' }, { offset: 1, color: '#e6e7ff' }]
      // },
    },
    cornersSquareOptions: {
      color: '#222222',
      type: 'extra-rounded' as CornerSquareType,
      // gradient: {
      //   type: 'linear', // 'radial'
      //   rotation: 180,
      //   colorStops: [{ offset: 0, color: '#25456e' }, { offset: 1, color: '#4267b2' }]
      // },
    },
    cornersDotOptions: {
      color: '#222222',
      type: 'dot' as CornerDotType,
      // gradient: {
      //   type: 'linear', // 'radial'
      //   rotation: 180,
      //   colorStops: [{ offset: 0, color: '#00266e' }, { offset: 1, color: '#4060b3' }]
      // },
    },
  })

  const [qrCodes, setQrCodes] = useState<QRCodeStyling>()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const QRCodeStyling = require('qr-code-styling')
      setQrCodes(new QRCodeStyling(options))
    }
  }, [])

  useEffect(() => {
    if (!qrCodes) return
    if (ref.current) {
      qrCodes.append(ref.current)
    }
  }, [qrCodes, ref])

  useEffect(() => {
    if (!qrCodes) return
    qrCodes.update(options)
  }, [qrCodes, options])

  const onDataChange = (url: string) => {
    if (!qrCodes) return
    setOptions((options) => ({
      ...options,
      data: url,
    }))
  }

  useEffect(() => {
    onDataChange(url)
  }, [url])

  return (
    <div className="bg-gray-900">
      <main className="mx-auto max-w-2xl px-4 pt-16 pb-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-100 sm:text-4xl">
          Store
        </h1>

        <form className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <ul
              role="list"
              className="divide-y divide-gray-200 border-t border-b border-gray-200"
            >
              {products.map((product, productIdx) => (
                <li key={product.id} className="flex py-6 sm:py-10">
                  <div className="flex-shrink-0"></div>

                  <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-sm">
                            <a
                              href={product.href}
                              className="font-medium text-gray-200 hover:text-gray-800"
                            >
                              {product.name}
                            </a>
                          </h3>
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-100">
                          {product.price}
                        </p>
                      </div>

                      <div className="mt-4 sm:mt-0 sm:pr-9">
                        <div className="absolute top-0 right-0">
                          <button
                            type="button"
                            className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500"
                          >
                            <span className="sr-only">Remove</span>
                            <XIconSolid
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 flex space-x-2 text-sm text-gray-200">
                      {product.inStock ? (
                        <CheckIcon
                          className="h-5 w-5 flex-shrink-0 text-green-500"
                          aria-hidden="true"
                        />
                      ) : (
                        <ClockIcon
                          className="h-5 w-5 flex-shrink-0 text-gray-300"
                          aria-hidden="true"
                        />
                      )}

                      <span>Product Description</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Payment Card */}
          <section
            aria-labelledby="payment-card"
            className="mt-16 rounded-lg  lg:col-span-5 lg:mt-0"
          >
            <PaymentCard
              setURL={setUrl}
              updateTransaction={updateTransaction}
              createTransaction={createTransaction}
              storeId={store.id}
              fields={store.fields}
              totalPrice={totalPrice}
              merchantETH={store.eth_address as string}
              merchantSOL={store.sol_address as string}
              setIsModalOpen={setIsModalOpen}
              setQrCode={setQrCode}
            />
          </section>
        </form>
      </main>
    </div>
  )
}

export default Store
