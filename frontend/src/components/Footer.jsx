import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600">
                <span className="text-xs font-bold text-white">UA</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">Utvecklarakademin</span>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              Skolplattform for yrkeshogskolan.
            </p>
          </div>

          <nav className="flex items-center gap-6">
            <Link to="/about" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Om oss
            </Link>
            <Link to="/contact" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Kontakt
            </Link>
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Logga in
            </Link>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            2026 Utvecklarakademin. Alla rattigheter forbehallna.
          </p>
        </div>
      </div>
    </footer>
  );
}
