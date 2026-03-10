export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-primary-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-primary-700 mb-6">
            Om Utvecklarakademin
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Utvecklarakademin ar en utbildningsanordnare inom yrkeshogskolan.
            Vi erbjuder kvalificerade yrkeshogskoleutbildningar som kombinerar
            teori med praktisk arbetslivserfarenhet for att forbereda studenter
            for framgangsrika karriarer inom IT och teknik.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-2xl shadow-sm border border-gray-100 bg-white p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Vad ar yrkeshogskolan?
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Yrkeshogskolan (YH) ar en eftergymnasiell utbildningsform som
              kombinerar teoretiska studier med arbetsplatsforlagt larande, sa
              kallat LIA (Larande i Arbete). Utbildningarna tas fram i nara
              samarbete med arbetslivet for att mota arbetsmarknadens faktiska
              behov av kvalificerad arbetskraft.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              En stor del av utbildningstiden tillbringas ute pa en arbetsplats
              dar studenten far praktisk erfarenhet och bygger sitt
              professionella natverk. Detta gor att YH-studenter ofta har hog
              anstallningsbarhet efter examen.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Yrkeshogskolan regleras av Myndigheten for yrkeshogskolan (MYH)
              och utbildningarna ar CSN-berattigade. Varje utbildning utformas
              efter branschens krav och kvalitetssakras lopande.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Varfor valja Utvecklarakademin?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl shadow-sm border border-gray-100 bg-white p-6 text-center">
              <h3 className="text-lg font-semibold text-primary-600 mb-3">
                Nara arbetslivet
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Vara utbildningar utvecklas tillsammans med branschforetag for
                att sakerstalla relevans och kvalitet.
              </p>
            </div>
            <div className="rounded-2xl shadow-sm border border-gray-100 bg-white p-6 text-center">
              <h3 className="text-lg font-semibold text-primary-600 mb-3">
                LIA-perioder
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Genom LIA far du praktisk erfarenhet och vaxer in i din
                framtida yrkesroll redan under utbildningen.
              </p>
            </div>
            <div className="rounded-2xl shadow-sm border border-gray-100 bg-white p-6 text-center">
              <h3 className="text-lg font-semibold text-primary-600 mb-3">
                Hog anstallningsbarhet
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                YH-utbildningar har bland de hogsta anstallningsgraderna
                efter examen jamfort med andra utbildningsformer.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
