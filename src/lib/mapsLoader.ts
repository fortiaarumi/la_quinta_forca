/// <reference types="@types/google.maps" />

// Google Maps — càrrega amb callback oficial per evitar race conditions

let loadPromise: Promise<void> | null = null;

export async function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    // Ja carregat prèviament
    if (typeof google !== 'undefined' && typeof google.maps?.importLibrary === 'function') {
      resolve();
      return;
    }

    // Google crida aquesta funció quan l'API està 100% inicialitzada
    const callbackName = '__googleMapsCallback__';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[callbackName] = async () => {
      try {
        await Promise.all([
          google.maps.importLibrary('maps'),
          google.maps.importLibrary('streetView'),
          google.maps.importLibrary('marker'),
          google.maps.importLibrary('geometry'),
        ]);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = [
      'https://maps.googleapis.com/maps/api/js',
      `?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
      '&v=weekly',
      '&loading=async',
      `&callback=${callbackName}`,
    ].join('');
    script.onerror = () => reject(new Error('Error carregant Google Maps'));
    document.head.appendChild(script);
  });

  return loadPromise;
}