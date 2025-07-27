"use client";

import { LayoutDashboard, LogOut, Menu, Package, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ナビゲーション項目の定義（プロジェクトに応じてカスタマイズ）
const navigationItems = [
	{
		title: "ダッシュボード",
		href: "/dashboard",
		icon: LayoutDashboard,
		description: "概要とメトリクス",
	},
	{
		title: "アイテム管理",
		href: "/items",
		icon: Package,
		description: "アイテムの登録・管理",
	},
	// Add more navigation items as needed
	// {
	//   title: "設定",
	//   href: "/settings",
	//   icon: Database,
	//   description: "システム設定"
	// }
];

export function MainNav() {
	const pathname = usePathname();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const handleSignOut = () => {
		signOut({ callbackUrl: "/login" });
	};

	return (
		<nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* ロゴ・タイトル */}
					<div className="flex items-center">
						<Link href="/dashboard" className="flex items-center space-x-2">
							<Package className="h-8 w-8 text-blue-600" />
							<span className="text-xl font-bold text-slate-900 hidden sm:block">
								アプリケーション
							</span>
							<span className="text-xl font-bold text-slate-900 sm:hidden">
								App
							</span>
						</Link>
					</div>

					{/* デスクトップナビゲーション */}
					<div className="hidden md:flex items-center space-x-8">
						{navigationItems.map((item) => {
							const isActive =
								pathname === item.href || pathname.startsWith(`${item.href}/`);
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
										isActive
											? "bg-blue-100 text-blue-700"
											: "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
									)}
								>
									<item.icon className="h-4 w-4" />
									<span>{item.title}</span>
								</Link>
							);
						})}
					</div>

					{/* ユーザーメニュー */}
					<div className="hidden md:flex items-center space-x-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleSignOut}
							className="text-slate-600 hover:text-slate-900"
						>
							<LogOut className="h-4 w-4 mr-2" />
							ログアウト
						</Button>
					</div>

					{/* モバイルメニューボタン */}
					<div className="md:hidden">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						>
							{isMobileMenuOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</Button>
					</div>
				</div>

				{/* モバイルメニュー */}
				{isMobileMenuOpen && (
					<div className="md:hidden border-t border-slate-200 py-4">
						<div className="space-y-2">
							{navigationItems.map((item) => {
								const isActive =
									pathname === item.href ||
									pathname.startsWith(`${item.href}/`);
								return (
									<Link
										key={item.href}
										href={item.href}
										className={cn(
											"flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors",
											isActive
												? "bg-blue-100 text-blue-700"
												: "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
										)}
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<item.icon className="h-5 w-5" />
										<div>
											<div>{item.title}</div>
											<div className="text-sm text-slate-500">
												{item.description}
											</div>
										</div>
									</Link>
								);
							})}
							<div className="border-t border-slate-200 pt-4">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleSignOut}
									className="w-full justify-start text-slate-600 hover:text-slate-900"
								>
									<LogOut className="h-4 w-4 mr-2" />
									ログアウト
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</nav>
	);
}
