import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Política de Privacidad
      </h1>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        Esta Política de Privacidad describe cómo se recopilan, utilizan y
        protegen los datos al usar esta web/app (la “Aplicación”).
      </p>

      <div className="mt-8 space-y-8 text-sm leading-6 text-slate-700 dark:text-slate-200">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Alcance
          </h2>
          <p>
            La Aplicación es de uso educativo/informativo y no tiene fines de
            lucro. Aun así, para habilitar funciones como el inicio de sesión y
            la persistencia de un perfil, se procesan ciertos datos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Datos que podemos tratar
          </h2>
          <p>
            Según el uso que hagas de la Aplicación, podemos tratar los
            siguientes datos:
          </p>
          <div className="space-y-2">
            <p className="font-semibold text-slate-900 dark:text-white">
              Datos de autenticación
            </p>
            <p>
              Si iniciás sesión con Google, se procesa tu identificador de
              usuario (UID) y datos básicos provistos por el proveedor (por
              ejemplo, nombre y/o foto de perfil).
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">
              Datos de perfil (opcional)
            </p>
            <p>
              Podés completar información adicional en tu perfil (por ejemplo,
              apodo, país, equipo favorito, género y fecha de nacimiento). Estos
              datos se usan únicamente para personalizar la experiencia dentro
              de la Aplicación.
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">
              Datos de uso / analítica
            </p>
            <p>
              La Aplicación puede utilizar analítica (por ejemplo, Vercel
              Analytics) para entender el uso general (páginas vistas, métricas
              agregadas). No buscamos identificarte personalmente con estas
              métricas.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Finalidades
          </h2>
          <p>Usamos los datos para:</p>
          <div className="space-y-1">
            <p>- Permitir inicio de sesión y mantener una sesión activa.</p>
            <p>- Guardar y recuperar tu perfil dentro de la Aplicación.</p>
            <p>- Mejorar la experiencia y estabilidad del producto.</p>
            <p>- Medir uso general mediante analítica agregada.</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Servicios de terceros
          </h2>
          <p>
            La Aplicación puede apoyarse en servicios de terceros para operar,
            por ejemplo:
          </p>
          <div className="space-y-1">
            <p>- Autenticación: Google/Firebase.</p>
            <p>- Hosting/infraestructura y analítica: Vercel (si aplica).</p>
            <p>- Base de datos: MongoDB (si aplica).</p>
          </div>
          <p>
            Cada servicio puede tratar datos conforme a sus propias políticas de
            privacidad.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Cookies y tecnologías similares
          </h2>
          <p>
            La Aplicación puede utilizar cookies o almacenamiento local para
            funcionamiento (por ejemplo, sesión) y/o analítica. Podés gestionar
            el uso de cookies desde la configuración de tu navegador.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            6. Conservación
          </h2>
          <p>
            Conservamos los datos únicamente mientras sean necesarios para
            brindar las funcionalidades o hasta que solicites su eliminación,
            sujeto a limitaciones técnicas o legales aplicables.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            7. Tus derechos
          </h2>
          <p>
            Podés solicitar acceso, corrección o eliminación de tus datos de
            perfil. También podés cerrar sesión y dejar de utilizar la
            Aplicación.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            8. Seguridad
          </h2>
          <p>
            Adoptamos medidas razonables para proteger los datos. Sin embargo,
            ninguna plataforma puede garantizar seguridad absoluta.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            9. Cambios a esta política
          </h2>
          <p>
            Podemos actualizar esta Política de Privacidad para reflejar cambios
            en la Aplicación. La versión vigente estará disponible en esta
            página.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            10. Contacto
          </h2>
          <p>
            Para consultas o solicitudes relacionadas con privacidad, podés
            contactarte a través del repositorio del proyecto.
          </p>
        </section>
      </div>
    </div>
  );
}
