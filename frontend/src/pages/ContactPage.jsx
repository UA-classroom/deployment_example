export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-primary-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-primary-700 mb-4">
            Kontakta oss
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Har du fragor om vara utbildningar eller vill veta mer om
            Utvecklarakademin? Tveka inte att hora av dig till oss.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl shadow-sm border border-gray-100 bg-white p-8 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-5">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                E-post
              </h3>
              <p className="text-gray-600 text-sm">
                info@utvecklarakademin.se
              </p>
            </div>

            <div className="rounded-2xl shadow-sm border border-gray-100 bg-white p-8 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-5">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Telefon
              </h3>
              <p className="text-gray-600 text-sm">
                08-123 45 67
              </p>
            </div>

            <div className="rounded-2xl shadow-sm border border-gray-100 bg-white p-8 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-5">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Adress
              </h3>
              <p className="text-gray-600 text-sm">
                Storgatan 1, 111 23 Stockholm
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-50">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Oppettider
          </h2>
          <div className="rounded-2xl shadow-sm border border-gray-100 bg-white p-8">
            <div className="space-y-3 text-gray-600">
              <div className="flex justify-between">
                <span>Mandag - Fredag</span>
                <span className="font-medium text-gray-900">08:00 - 17:00</span>
              </div>
              <div className="flex justify-between">
                <span>Lordag - Sondag</span>
                <span className="font-medium text-gray-900">Stangt</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
