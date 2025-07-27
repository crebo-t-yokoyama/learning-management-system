import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { MainNav } from "@/components/navigation/main-nav";
import { Button } from "@/components/ui/button";

export default async function ItemsPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<MainNav />
			<div className="container mx-auto px-4 py-8">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold">アイテム管理</h1>
					<Link href="/items/new">
						<Button className="bg-blue-600 text-white hover:bg-blue-700">
							新規登録
						</Button>
					</Link>
				</div>

				{/* Sample empty state */}
				<div className="bg-white rounded-lg shadow p-8 text-center">
					<div className="space-y-4">
						<h2 className="text-xl font-semibold text-gray-900">アイテムがありません</h2>
						<p className="text-gray-500">
							まだアイテムが登録されていません。最初のアイテムを登録してみましょう。
						</p>
						<Link href="/items/new">
							<Button className="mt-4">
								アイテムを登録
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
