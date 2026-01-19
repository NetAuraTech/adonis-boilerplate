import { ReactNode, useState } from 'react'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
}

export function Tabs(props: TabsProps) {
  const { tabs, defaultTab } = props
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className="grid gap-6">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              padding-block-2 padding-inline-4 fs-400 fw-semi-bold
              border-0 border-bottom-2 border-solid cursor-pointer
              transition:all-300 bg-transparent
              ${
              activeTab === tab.id
                ? 'border-accent-700 clr-accent-700'
                : 'border-transparent clr-neutral-600 hover:border-accent-700 hover:clr-accent-700'
            }
            `}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {activeContent}
      </div>
    </div>
  )
}
