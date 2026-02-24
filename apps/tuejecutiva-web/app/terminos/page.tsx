export default function TerminosPage() {
  return (
    <main className="bg-white px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Términos y Condiciones
        </h1>
        <p className="mt-6 text-xl leading-8">
          Bienvenido a TuEjecutiva.cl. Al usar nuestro portal, aceptas las
          siguientes condiciones.
        </p>

        <div className="mt-10 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              1. Naturaleza del Servicio
            </h2>
            <p className="mt-4">
              TuEjecutiva.cl es un portal que conecta usuarios con ejecutivas de
              contratación. No somos una compañía de seguros, isapre ni
              proveedor de servicios financieros/médicos directos. Nuestra labor
              se limita a facilitar el contacto y verificar la identidad de
              quienes publican.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              2. Responsabilidad
            </h2>
            <p className="mt-4">
              TuEjecutiva.cl verifica antecedentes básicos, pero no se hace
              responsable por el cumplimiento de los contratos firmados entre
              el usuario y la ejecutiva/empresa representada. Es responsabilidad
              del usuario leer todos los contratos antes de firmar.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
