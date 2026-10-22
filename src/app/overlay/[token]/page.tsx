import { OverlayClient } from "@/components/overlay-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Bagisawer Overlay",
  robots: { index: false, follow: false },
  referrer: "no-referrer"
};

export default async function OverlayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <OverlayClient token={token} />;
}
