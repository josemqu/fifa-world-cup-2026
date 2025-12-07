export const JsonLd = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FIFA World Cup 2026 Simulator",
    applicationCategory: "SportsApplication",
    operatingSystem: "Any",
    description:
      "Simula los resultados del Mundial 2026 con este fixture interactivo. Predice los partidos, calcula la tabla de posiciones y visualiza el cuadro de la fase final.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "José",
    },
    about: {
      "@type": "SportsEvent",
      name: "FIFA World Cup 2026",
      startDate: "2026-06-11",
      endDate: "2026-07-19",
      location: [
        {
          "@type": "Country",
          name: "United States",
        },
        {
          "@type": "Country",
          name: "Mexico",
        },
        {
          "@type": "Country",
          name: "Canada",
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};
