export default function Card({ children, className = '', ...rest }) {
  return (
    <div className={`card p-4 ${className}`} {...rest}>
      {children}
    </div>
  )
}
