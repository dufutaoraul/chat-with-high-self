'use client';

import { useFormStatus } from 'react-dom';
import { ReactNode } from 'react';

interface SubmitButtonProps {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}

export function SubmitButton({ 
  children, 
  pendingText = "提交中...", 
  className = "",
  formAction
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      formAction={formAction}
    >
      {pending ? pendingText : children}
    </button>
  );
}