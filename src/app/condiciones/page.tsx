import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
};

export default function CondicionesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Términos y Condiciones
      </h1>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        Al acceder y utilizar este sitio web/aplicación (en adelante, la
        “Aplicación”), aceptás estos Términos y Condiciones.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-6 text-slate-700 dark:text-slate-200">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Finalidad educativa y sin fines de lucro
          </h2>
          <p>
            La Aplicación tiene una finalidad educativa, informativa y de
            entretenimiento. No es un producto oficial, no opera con fines de
            lucro ni busca explotar comercialmente ningún contenido.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Independencia y no afiliación
          </h2>
          <p>
            La Aplicación no está afiliada, patrocinada ni aprobada por FIFA,
            federaciones, confederaciones, selecciones nacionales, ligas,
            organizadores ni titulares de derechos relacionados.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Marcas, logotipos y nombres
          </h2>
          <p>
            Las marcas, nombres, logotipos, escudos y demás signos distintivos
            que puedan mencionarse o mostrarse pertenecen a sus respectivos
            titulares. Su uso en la Aplicación, si existiera, tiene un propósito
            referencial y descriptivo, sin intención de infringir derechos ni de
            realizar uso comercial.
          </p>
          <p>
            Si considerás que algún contenido vulnera derechos, podés solicitar
            su revisión y/o retiro.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Contenido, datos y exactitud
          </h2>
          <p>
            La información (fixture, resultados, rankings, probabilidades,
            simulaciones u otros datos) puede ser estimada, experimental o
            provenir de fuentes externas. Se ofrece “tal cual”, sin garantías de
            exactitud, integridad o actualización.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Simulaciones y predicciones
          </h2>
          <p>
            Las predicciones y simulaciones son aproximaciones basadas en
            modelos y/o supuestos y no constituyen asesoramiento ni aseguran un
            resultado real. La Aplicación no promueve apuestas ni juegos de
            azar.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            6. Responsabilidad
          </h2>
          <p>
            En la medida permitida por la normativa aplicable, el uso de la
            Aplicación es bajo tu exclusiva responsabilidad. No asumimos
            responsabilidad por daños directos o indirectos derivados del uso o
            imposibilidad de uso.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            7. Cambios
          </h2>
          <p>
            Podemos modificar estos Términos y Condiciones para reflejar mejoras
            o cambios en la Aplicación. El uso continuado implica la aceptación
            de la versión vigente.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            8. Contacto
          </h2>
          <p>
            Para consultas, reportes o solicitudes de retiro de contenido, podés
            contactarte a través del repositorio del proyecto.
          </p>
        </section>
      </div>
    </div>
  );
}
