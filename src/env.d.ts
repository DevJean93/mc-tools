// `process.env` solo se lee al construir (Base.astro, versión del pie: PUB-06). Se declara lo justo en
// lugar de añadir `@types/node`, que sería una dependencia nueva (constitución, principio 9).
declare const process: { env: Record<string, string | undefined> };
