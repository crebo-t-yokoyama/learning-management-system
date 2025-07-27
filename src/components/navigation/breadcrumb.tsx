"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
	title: string;
	href: string;
}

// パスから自動的にブレッドクラムを生成するためのマッピング
const pathMapping: Record<string, string> = {
	"/dashboard": "ダッシュボード",
	"/items": "アイテム管理",
	"/items/new": "新規登録",
	"/items/[id]/edit": "編集",
};

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
	const breadcrumbs: BreadcrumbItem[] = [
		{ title: "ホーム", href: "/dashboard" },
	];

	// ログインページの場合は空を返す
	if (pathname === "/login" || pathname === "/") {
		return [];
	}

	const segments = pathname.split("/").filter(Boolean);
	let currentPath = "";

	for (let i = 0; i < segments.length; i++) {
		currentPath += `/${segments[i]}`;

		// 動的ルート([id])の場合
		if (segments[i] && /^[0-9a-f-]{36}$/.test(segments[i])) {
			// UUIDの場合は次のセグメントで判定
			if (i + 1 < segments.length) {
				const nextSegment = segments[i + 1];
				const dynamicPath = `${currentPath.replace(segments[i], "[id]")}/${nextSegment}`;
				const title = pathMapping[dynamicPath];
				if (title) {
					breadcrumbs.push({
						title,
						href: `${currentPath}/${nextSegment}`,
					});
					i++; // 次のセグメントもスキップ
					currentPath += `/${nextSegment}`;
				}
			}
		} else {
			const title = pathMapping[currentPath];
			if (title && currentPath !== "/dashboard") {
				breadcrumbs.push({
					title,
					href: currentPath,
				});
			}
		}
	}

	return breadcrumbs;
}

interface BreadcrumbProps {
	className?: string;
}

export function Breadcrumb({ className }: BreadcrumbProps) {
	const pathname = usePathname();
	const breadcrumbs = generateBreadcrumbs(pathname);

	// ブレッドクラムが1つ以下の場合は表示しない
	if (breadcrumbs.length <= 1) {
		return null;
	}

	return (
		<nav
			className={cn(
				"flex items-center space-x-1 text-sm text-slate-600",
				className,
			)}
		>
			{breadcrumbs.map((item, index) => (
				<div key={item.href} className="flex items-center">
					{index > 0 && (
						<ChevronRight className="h-4 w-4 mx-2 text-slate-400" />
					)}
					{index === 0 && <Home className="h-4 w-4 mr-1" />}
					{index === breadcrumbs.length - 1 ? (
						<span className="font-medium text-slate-900">{item.title}</span>
					) : (
						<Link
							href={item.href}
							className="hover:text-slate-900 transition-colors"
						>
							{item.title}
						</Link>
					)}
				</div>
			))}
		</nav>
	);
}
