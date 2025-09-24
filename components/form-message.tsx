export type Message = {
  error?: string;
  success?: string;
  message?: string;
};

export function FormMessage({ message }: { message: Message }) {
  if (!message) return null;

  if (message.error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {message.error}
      </div>
    );
  }

  if (message.success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
        {message.success}
      </div>
    );
  }

  if (message.message) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
        {message.message}
      </div>
    );
  }

  return null;
}