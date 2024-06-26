import { useShopCarStore } from "stores/shop-car";
import { TicketProduct } from "./ticket-product";
import { priceFormmater } from "./product-card";
import { useState } from "react";
import type { clients } from "db/schema";

interface Props {
    clients: typeof clients.$inferSelect[]
}

export const ShopCar = ({ clients }: Props) => {
    const { shopCarProducts, client } = useShopCarStore((state) => ({
        shopCarProducts: state.products,
        client: state.client
    }));

    const total = shopCarProducts.reduce((acc, { price, quantity }) => acc + price * quantity, 0);

    const [currentSection, setCurrentSection] = useState<'client' | 'ticket'>('ticket')
    const [cash, setCash] = useState(0)

    return (
        <section className="flex flex-col flex-1">
            <div className="flex mb-2">
                <button
                    onClick={() => setCurrentSection('ticket')}
                    className={`flex-1 p-2 text-white ${currentSection === 'ticket' ? 'bg-blue-500' : 'bg-blue-400'
                        }`}
                >
                    Ticket
                </button>

                <button
                    onClick={() => setCurrentSection('client')}
                    className={`flex-1 p-2 text-white ${currentSection === 'client' ? 'bg-blue-500' : 'bg-blue-400'
                        }`}
                >
                    Clients
                </button>
            </div>

            <div className={`transition-opacity duration-300 ${currentSection === 'ticket' ? 'opacity-100' : 'opacity-0'}`}>
                {currentSection === 'ticket' && (
                    <div className="flex-1 h-full flex flex-col justify-between gap-2 ">
                        <ul className="flex flex-col gap-2 flex-1 overflow-y-auto">
                            {shopCarProducts.map((product) => (
                                <TicketProduct key={product.id} {...product} />
                            ))}
                        </ul>

                        <form
                            className="flex flex-col gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();

                                if (total === 0) {
                                    alert("You need to add products to sell");
                                    return;
                                }

                                if (client === 0) {
                                    alert("You need to select a client");
                                    return;
                                }

                                if (cash < total) {
                                    alert("The cash is less than the total");
                                    return;
                                }

                                if (shopCarProducts.some(({ stock, quantity }) => stock < quantity)) {
                                    alert("There are products with insufficient stock");
                                    return;
                                }

                                if (!confirm("Are you sure you want to sell these products?")) {
                                    return;
                                }

                                const data = new FormData(e.currentTarget);

                                const paymentMethod = data.get("paymentMethod") as string;

                                fetch("/api/sales/sell", {
                                    method: "POST",
                                    body: JSON.stringify({
                                        sell: {
                                            cashback: cash - total < 0 ? 0 : cash - total,
                                            clientId: client,
                                            receivedAmount: cash,
                                            total,
                                            paymentMethod,
                                            status: 'completed'
                                        },
                                        items: shopCarProducts.map(({ id, quantity }) => ({
                                            productId: id,
                                            quantity
                                        }))
                                    })
                                })
                                    .then(res => {
                                        if (res.ok) {
                                            useShopCarStore.setState({ products: [], client: 0 });
                                            alert("The sale was successful");
                                        }
                                        setCash(0);

                                        window.location.reload();
                                    })
                            }}
                        >
                            
                            <div className="flex w-full justify-between mb-2">
                                <div className="flex flex-col gap-1">
                                    <label className="flex w-fit items-center gap-2 text-sm ">
                                        <span
                                            className="text-black/50 "
                                        >Payment Method:</span>
                                        <select
                                            name="paymentMethod"
                                            className="w-full p-2 rounded-md border-gray-400 border-2"
                                        >
                                            <option className=" 
                                        text-black/50
                                          
                                        
                                         " value="cash">Cash</option>
                                            <option value="credit_card">Credit Card</option>
                                        </select>
                                    </label>


                                    <label className="flex w-fit items-center gap-2 text-sm">
                                        Cash:
                                        <input
                                            name="cash"
                                            type="number"
                                            placeholder="0"
                                            className="w-full p-2 rounded-md border-gray-400 border-2"
                                            value={cash}
                                            onChange={(e) => setCash(Number(e.target.value))}
                                        />
                                    </label>
                                </div>

                                <div className="flex flex-col items-end justify-end gap-2
                            w-1/3
                             
                            
                            ">
                                    <span className="text-black/50 ">Total: {
                                        priceFormmater.format(
                                            total
                                        )
                                    }</span>

                                    <span className="text-black/50">Change: {
                                        priceFormmater.format(
                                            cash - total < 0 ? 0 : cash - total
                                        )
                                    }</span>
                                </div>
                            </div>

                            <button className="w-full p-4 bg-blue-500 text-white rounded-md">
                                Checkout
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <div className={`transition-opacity duration-300 ${currentSection === 'client' ? 'opacity-100' : 'opacity-0'}`}>
                {currentSection === 'client' && (
                    <div className="flex-1 h-full flex flex-col justify-between gap-2 animate-fadeIn">
                        <ul className="flex flex-col gap-2 flex-1 overflow-y-auto">
                            {clients.map((c) => (
                                <li
                                    key={c.id}
                                    className={`gap-2 p-2 text-black cursor-pointer rounded-md shadow-lg bg-blue border-black ${c.id === client ? 'bg-blue-300 shadow-md' : 'hover:bg-slate-400'}`}
                                    onClick={() => useShopCarStore.setState({ client: c.id })}
                                >
                                    {c.name}
                                </li>
                            ))}
                        </ul>
                        <a href="/dashboard/clients/add"
                            className="w-full p-4 bg-blue-500 text-white rounded-md text-center hover:bg-blue-600 transition-colors"
                        >
                            Add new client
                        </a>
                    </div>
                )}
            </div>

        </section>
    )
}
