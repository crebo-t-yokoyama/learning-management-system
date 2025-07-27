import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MainNav } from "@/components/navigation/main-nav";
import { ItemForm } from "@/components/items/item-form";

export default async function NewItemPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<MainNav />
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-8">アイテム登録</h1>
				<div className="max-w-2xl">
					<ItemForm />
				</div>
			</div>
		</div>
	);
}