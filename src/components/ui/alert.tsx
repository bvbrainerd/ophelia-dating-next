import * as React from "react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const baseStyles = "relative w-full rounded-lg border px-4 py-3 text-sm"
    const variantStyles = variant === 'destructive' 
      ? "border-red-200 bg-red-50 text-red-700"
      : "bg-gray-50 border-gray-200 text-gray-700"

    return (
      <div
        ref={ref}
        role="alert"
        className={`${baseStyles} ${variantStyles} ${className}`}
        {...props}
      />
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h5
    ref={ref}
    className={`mb-1 font-medium leading-none tracking-tight ${className}`}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm ${className}`}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }