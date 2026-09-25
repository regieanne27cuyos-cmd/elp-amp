import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="flex items-center justify-between bg-blue-950 shadow px-6 py-4">
        <div className="text-2xl font-bold text-white">
            ELP-AMP
        </div>
        <div className="flex gap-10">
            <Link to="/Dashboard" className="text-lg font-bold text-white">Dashboard</Link>
        </div> 
    </nav>
  )
}

export default Navbar