import Canvas from "./Canvas";

export default async function CanvasPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return <Canvas roomId={roomId} />;
}
