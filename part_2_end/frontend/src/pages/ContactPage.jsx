import React from "react";

export default function ContactPage() {
  return (
    <>
      <div className="container min-h-screen py-10 mx-auto">
        <div className="py-10">
          <h1 className="text-5xl font-bold leading-none text-center ">
            Contact us
          </h1>
          <p className="text-center text-[16px] text-gray-400">
            Send us a message anytime. We'll get right back to you in 12h.
          </p>
        </div>
        <div className="flex items-center justify-center ">
          <div className="flex justify-center w-full max-w-md p-8 bg-white border border-gray-300 rounded-lg shadow-md"></div>
        </div>
      </div>
    </>
  );
}
