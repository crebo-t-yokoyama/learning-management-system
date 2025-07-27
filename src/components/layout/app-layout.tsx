"use client";

import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { MainNav } from "@/components/navigation/main-nav";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
	children: React.ReactNode;
	title?: string;
	description?: string;
	className?: string;
	showBreadcrumb?: boolean;
}

export function AppLayout({
	children,
	title,
	description,
	className,
	showBreadcrumb = true,
}: AppLayoutProps) {
	return (
		<div className="min-h-screen bg-slate-50">
			<MainNav />

			<main className="flex-1">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
					{/* ブレッドクラム */}
					{showBreadcrumb && (
						<div className="mb-6">
							<Breadcrumb />
						</div>
					)}

					{/* ページヘッダー */}
					{(title || description) && (
						<div className="mb-8">
							{title && (
								<h1 className="text-3xl font-bold text-slate-900">{title}</h1>
							)}
							{description && (
								<p className="text-slate-600 mt-1">{description}</p>
							)}
						</div>
					)}

					{/* メインコンテンツ */}
					<div className={cn("", className)}>{children}</div>
				</div>
			</main>
		</div>
	);
}
