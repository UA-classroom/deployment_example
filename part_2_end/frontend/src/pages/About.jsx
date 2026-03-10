export default function AboutPage() {
  return (
    <section className="py-24 relative">
      <div className="w-full max-w-7xl px-4 md:px-5 lg:px-5 mx-auto">
        <div className="w-full flex-col justify-center items-center gap-8 flex">
          <h2 className="text-gray-900 text-4xl font-bold font-manrope leading-normal text-center">
            About This App
          </h2>
          <p className="text-gray-500 text-base font-normal leading-relaxed text-center max-w-2xl">
            This is a starter template with authentication, user management,
            and a dashboard layout. Built with FastAPI, PostgreSQL, React,
            and Tailwind CSS.
          </p>
        </div>
      </div>
    </section>
  );
}
