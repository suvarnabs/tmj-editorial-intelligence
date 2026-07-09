export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <div className="state-box">{label}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="state-box error">{message}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return <div className="state-box">{message}</div>;
}
