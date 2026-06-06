'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { CategoryContent } from '@/features/article/types'

type Props = {
  siteName: string
  categories: CategoryContent[]
}

export function Header({ siteName, categories }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold">
          {siteName}
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link href="/" className="text-sm hover:underline">
            ホーム
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="text-sm hover:underline"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        <div className="sm:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="メニューを開く">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle>メニュー</SheetTitle>
              <nav className="mt-6 flex flex-col gap-4">
                <Link href="/" onClick={() => setOpen(false)} className="hover:underline">
                  ホーム
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.id}`}
                    onClick={() => setOpen(false)}
                    className="hover:underline"
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
