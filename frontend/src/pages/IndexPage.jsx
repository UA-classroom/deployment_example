import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group relative bg-white rounded-2xl p-7 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:shadow-primary-600/5 hover:-translate-y-0.5">
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary-50 text-primary-600 mb-4 transition-colors duration-200 group-hover:bg-primary-100">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

FeatureCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

function StatItem({ value, label }) {
  return (
    <div className="text-center px-4">
      <div className="text-2xl font-bold text-primary-600">{value}</div>
      <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

StatItem.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Glow behind the card */}
      <div className="absolute -inset-4 bg-gradient-to-b from-primary-500/10 to-transparent rounded-3xl blur-2xl" />

      <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-900/10 border border-gray-200/60 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <div className="ml-4 h-5 w-48 bg-gray-200 rounded-md" />
        </div>

        <div className="flex">
          {/* Sidebar mock */}
          <div className="hidden sm:block w-48 border-r border-gray-100 bg-gray-50/50 p-4 space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg">
              <div className="w-4 h-4 rounded bg-primary-500" />
              <span className="text-xs font-medium text-primary-700">Dashboard</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-gray-400">
              <div className="w-4 h-4 rounded bg-gray-200" />
              <span className="text-xs">Program</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-gray-400">
              <div className="w-4 h-4 rounded bg-gray-200" />
              <span className="text-xs">Studenter</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-gray-400">
              <div className="w-4 h-4 rounded bg-gray-200" />
              <span className="text-xs">Betyg</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-gray-400">
              <div className="w-4 h-4 rounded bg-gray-200" />
              <span className="text-xs">LIA</span>
            </div>
          </div>

          {/* Main content mock */}
          <div className="flex-1 p-5 space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary-50 rounded-xl p-4">
                <div className="text-xs text-primary-500 font-medium">Aktiva program</div>
                <div className="text-xl font-bold text-gray-900 mt-1">3</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-xs text-green-600 font-medium">Studenter</div>
                <div className="text-xl font-bold text-gray-900 mt-1">42</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="text-xs text-amber-600 font-medium">LIA-platser</div>
                <div className="text-xl font-bold text-gray-900 mt-1">12</div>
              </div>
            </div>

            {/* Table mock */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <div className="text-xs font-semibold text-gray-700">Senaste betyg</div>
                <div className="h-5 w-16 bg-gray-200 rounded-md" />
              </div>
              {["Anna S.", "Erik L.", "Maria K."].map((name, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary-600">{name[0]}</span>
                    </div>
                    <span className="text-xs text-gray-700">{name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i === 0 ? "bg-green-100 text-green-700" : i === 1 ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"}`}>
                    {i === 2 ? "VG" : "G"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IndexPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50 via-primary-50/40 to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-100/50 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
              Skolplattformen for{" "}
              <span className="text-primary-600">yrkeshogskolan</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-xl mx-auto">
              Hantera program, studenter, betyg och LIA-platser
              -- allt samlat i en plattform byggd for YH.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center px-7 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl shadow-lg shadow-primary-600/25 transition-all duration-200 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98]"
              >
                Logga in
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center px-7 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]"
              >
                Lasa mer
              </a>
            </div>
          </div>

          {/* Dashboard preview */}
          <DashboardMockup />
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-10 flex items-center justify-center gap-8 sm:gap-16">
          <StatItem value="400+" label="YH-poang" />
          <div className="w-px h-10 bg-gray-200" />
          <StatItem value="IG/G/VG" label="Betyg" />
          <div className="w-px h-10 bg-gray-200" />
          <StatItem value="LIA" label="Integrerat" />
          <div className="hidden sm:block w-px h-10 bg-gray-200" />
          <div className="hidden sm:block">
            <StatItem value="CSN" label="Rapportering" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Allt en utbildningsanordnare behover
            </h2>
            <p className="mt-4 text-gray-500">
              Fran programplanering till examen -- ett system som foljer hela utbildningsresan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                </svg>
              }
              title="Program och kurser"
              description="Skapa och hantera YH-program med kursplaner, YH-poang och utbildningsplaner enligt MYH:s krav."
            />
            <FeatureCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              }
              title="Studenter och kohorter"
              description="Hantera inskrivning, kohorter och hela studentresan fran antagning till examen."
            />
            <FeatureCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
              }
              title="Betygssystem"
              description="IG, G, VG -- med full sporbarhet, omexamination och 4-veckors rapporteringsdeadline."
            />
            <FeatureCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              }
              title="LIA-hantering"
              description="Koppla studenter till foretag och handledare. Folj upp arbetsplatsforlagt larande."
            />
            <FeatureCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              }
              title="Narvarorapportering"
              description="Spara narvaro for CSN-rapportering. Skilj pa giltig och ogiltig franvaro."
            />
            <FeatureCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              }
              title="MYH-anpassat"
              description="Byggt efter forordning (2009:130). Kursplaner, utbildningsplaner och examen enligt regelverk."
            />
          </div>
        </div>
      </section>
    </main>
  );
}
