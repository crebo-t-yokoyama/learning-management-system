import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { itemSchema } from "@/lib/validations";

export async function GET(_request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.email) {
			return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
		}

		const supabase = await createServerSupabaseClient();
		const { data: items, error } = await supabase
			.from("items")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Items fetch error:", error);
			return NextResponse.json(
				{ error: "アイテムの取得に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ items });
	} catch (error) {
		console.error("API Error:", error);
		return NextResponse.json(
			{ error: "サーバーエラーが発生しました" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.email) {
			return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
		}

		const body = await request.json();
		const validatedData = itemSchema.parse(body);

		const supabase = await createServerSupabaseClient();
		const { data: item, error } = await supabase
			.from("items")
			.insert({
				...validatedData,
				created_by: session.user.id,
				updated_by: session.user.id,
			})
			.select()
			.single();

		if (error) {
			console.error("Item creation error:", error);
			return NextResponse.json(
				{ error: "アイテムの作成に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ item }, { status: 201 });
	} catch (error) {
		console.error("API Error:", error);
		if (error instanceof Error && error.name === "ZodError") {
			return NextResponse.json(
				{ error: "入力データが正しくありません" },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: "サーバーエラーが発生しました" },
			{ status: 500 },
		);
	}
}
