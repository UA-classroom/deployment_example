import { createContext } from "react";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";

// Create the ProductContext
export const ProductContext = createContext();

function Layout() {
  return (
      <div className="flex flex-col min-h-screen">
          <Header />
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
      </div>
  );
}

export default Layout;
