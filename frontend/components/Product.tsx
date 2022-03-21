import { useEffect, useState } from "react"
import { Product } from "../pages/api/product"

interface Props {
	product: Product
	add: Function
	remove: Function
	productIds: any[]
}

const Product = (props: Props) => {
	const [isOpen, setIsOpen] = useState(false)
	const [noProducts, setNoProducts] = useState(0)

	const handleCheckChange = (changed: boolean) => {
		if(changed) {
			console.log('1')
			props.add([props.product])
			setNoProducts((ps) => {
				return ps + 1
			})
		} else {
			console.log('2')
			console.log(1)
			props.remove([props.product])
			setNoProducts((ps) => {
				return ps - 1
			})
		}
	}

	useEffect(() => {
		if(props.productIds && props.productIds.length > 0) {
			handleCheckChange(true)	
		}
	}, [])

	return (
		<div className="w-full h-full flex flex-col grow-0 justify-start items-start">
			<div className="flex justify-center items-center space-x-5">
				<div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer flex justify-start items-center space-x-3">
					{!isOpen && 
						<svg onClick={() => setIsOpen(true)} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
						</svg>
					}
					{isOpen && 
						<svg onClick={() => setIsOpen(false)} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
						</svg>
					}
					<h1 className="text-xl font-bold select-none">{props.product.name}</h1>
				</div>
				<button onClick={(e) => handleCheckChange(true)} name="" id="">+</button>
				<p>{noProducts}</p>
				<button onClick={(e) => handleCheckChange(false)} name="" id="">-</button>
			</div>
			<div className={(isOpen ? "" : "hidden ") + "w-full p-3 space-y-3"}>
				<p className="text-md font-normal">
					{props.product.description}
					<br />
					$ {props.product.discounted_price}
				</p>
				<div className="flex flex-col space-y-3">
					{props.product.links.map(value => (
						<a href={value} className="text-xs text-blue-900 underline">{value}</a>
					))}
				</div>
			</div>
		</div>
	)
}

export default Product