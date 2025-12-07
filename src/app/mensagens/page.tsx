// ESTE ARQUIVO NÃO TEM "use client"

export const dynamic = "force-dynamic";
export const revalidate = 0;

import MensagensClient from "./MensagensClient";

export default function MensagensPageWrapper() {
  return <MensagensClient />;
}
