interface AdminHeaderProps {
  handleClick: () => void
}

export function AdminHeader(props: AdminHeaderProps) {
  const { handleClick } = props

  return (
    <header
      className="display-flex align-items-center justify-content-space-between padding-4 bg-neutral-100 border-bottom-1 border-neutral-200 sticky top-0"
      style={{ zIndex: 50 }}
    >
      <button
        onClick={handleClick}
        className="lg:display-hidden padding-2 border-radius-1 bg-neutral-200 hover:bg-neutral-300 transition:bg-300"
        aria-label="Toggle sidebar"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className="display-flex align-items-center gap-4">
        <button className="padding-2 border-radius-1 hover:bg-neutral-200 transition:bg-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        <button className="padding-2 border-radius-1 hover:bg-neutral-200 transition:bg-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
