import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import type { Entry } from '../types'

interface BreadcrumbsProps {
  entries: Entry[]
}

export function Breadcrumbs({ entries }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
        {entries.map((entry, index) => {
          const isCurrent = index === entries.length - 1

          return (
            <Fragment key={entry.id}>
              {index > 0 ? <li aria-hidden="true">/</li> : null}
              <li className="min-w-0">
                {isCurrent ? (
                  <span aria-current="page" className="block truncate font-medium text-slate-700">
                    {entry.name}
                  </span>
                ) : (
                  <Link className="block truncate transition hover:text-blue-600" to={`/folders/${entry.id}`}>
                    {entry.name}
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
