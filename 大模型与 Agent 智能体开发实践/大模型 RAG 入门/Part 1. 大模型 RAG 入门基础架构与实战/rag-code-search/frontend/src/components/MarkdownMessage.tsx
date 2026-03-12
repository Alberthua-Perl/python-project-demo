import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Highlight, themes } from 'prism-react-renderer'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface CodeBlockProps {
  language: string
  code: string
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(() => code.split('\n').length > 20)
  const lineCount = code.split('\n').length
  const isDark = document.documentElement.classList.contains('dark')

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-border text-sm shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border">
        <span className="text-xs font-mono font-medium text-primary tracking-wide">
          {language || 'text'}
        </span>
        <div className="flex items-center gap-3">
          {lineCount > 20 && (
            <button
              onClick={() => setCollapsed(c => !c)}
              className="cursor-pointer flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {collapsed ? (
                <><ChevronDown size={12} /> 展开 ({lineCount} 行)</>
              ) : (
                <><ChevronUp size={12} /> 折叠</>
              )}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="cursor-pointer flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <><Check size={12} className="text-primary" /> 已复制</>
            ) : (
              <><Copy size={12} /> 复制</>
            )}
          </button>
        </div>
      </div>
      {!collapsed && (
        <Highlight
          theme={isDark ? themes.vsDark : themes.github}
          code={code.trimEnd()}
          language={language || 'text'}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={`${className} p-4 overflow-x-auto text-xs leading-relaxed`}
              style={{ ...style, margin: 0, borderRadius: 0 }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      )}
    </div>
  )
}

interface Props {
  content: string
}

export default function MarkdownMessage({ content }: Props) {
  return (
    <div className="prose-sm max-w-none text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            if (match) {
              return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-xs text-primary border border-border/60"
                {...props}
              >
                {children}
              </code>
            )
          },
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-7 text-sm">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-semibold mb-3 mt-5 text-foreground tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-2 mt-4 text-foreground tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mb-2 mt-3 text-foreground">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-3 space-y-1.5 text-sm">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-sm">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-7">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 pl-4 my-3 text-muted-foreground italic text-sm">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-border">
              <table className="text-sm border-collapse w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border px-4 py-2 bg-muted/50 font-semibold text-left text-xs uppercase tracking-wide text-muted-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/50 px-4 py-2 text-sm last:border-0">{children}</td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-4 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

