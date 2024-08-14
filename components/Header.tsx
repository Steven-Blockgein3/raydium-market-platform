import Link from 'next/link';
import WalletButton from "./WalletButton";

export default function Header() {
    return (
        <div className='flex justify-between items-center bg-white px-7 rounded-xl w-full h-[80px]'>
            <span className="text-[20px]"> Raydium Market Platform</span>
            <nav>
                <ul className="flex space-x-4">
                    <li><Link href="/" className="hover:text-blue-500">Home</Link></li>
                    <li><Link href="/token-mint" className="hover:text-blue-500">Token Mint</Link></li>
                    <li><Link href="/liquidity-pool" className="hover:text-blue-500">Liquidity Pool</Link></li>
                    <li><Link href="/market-maker" className="hover:text-blue-500">Market Maker</Link></li>
                </ul>
            </nav>
            <WalletButton />
        </div>
    );
}
