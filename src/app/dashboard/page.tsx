import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MainNav } from "@/components/navigation/main-nav";

export default async function DashboardPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<MainNav />
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* Sample dashboard cards */}
					<div className="bg-white p-6 rounded-lg shadow">
						<h2 className="text-xl font-semibold mb-2">総アイテム数</h2>
						<p className="text-3xl font-bold text-blue-600">--</p>
					</div>

					<div className="bg-white p-6 rounded-lg shadow">
						<h2 className="text-xl font-semibold mb-2">アクティブユーザー</h2>
						<p className="text-3xl font-bold text-green-600">--</p>
					</div>

					<div className="bg-white p-6 rounded-lg shadow">
						<h2 className="text-xl font-semibold mb-2">統計情報</h2>
						<p className="text-3xl font-bold text-purple-600">--</p>
					</div>
				</div>

				<div className="mt-8">
					<h2 className="text-2xl font-bold mb-4">クイックアクション</h2>
					<div className="space-y-4">
						<p className="text-muted-foreground">
							これはテンプレートダッシュボードです。プロジェクトのニーズに応じてカスタマイズしてください。
						</p>
						<p className="text-muted-foreground">
							ここに独自のメトリクス、チャート、クイックアクションボタンを追加してください。
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
