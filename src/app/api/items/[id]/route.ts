import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { itemSchema } from "@/lib/validations";

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const params = await context.params;
	try {
		const session = await auth();
		if (!session?.user?.email) {
			return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
		}

		const supabase = await createServerSupabaseClient();
		const { data: item, error } = await supabase
			.from("items")
			.select("*")
			.eq("id", params.id)
			.single();

		if (error) {
			console.error("Item fetch error:", error);
			return NextResponse.json(
				{ error: "アイテムが見つかりません" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ item });
	} catch (error) {
		console.error("API Error:", error);
		return NextResponse.json(
			{ error: "サーバーエラーが発生しました" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const params = await context.params;
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
			.update({
				...validatedData,
				updated_by: session.user.id,
				updated_at: new Date().toISOString(),
			})
			.eq("id", params.id)
			.select()
			.single();

		if (error) {
			console.error("Item update error:", error);
			return NextResponse.json(
				{ error: "アイテムの更新に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ item });
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

export async function DELETE(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const params = await context.params;
	try {
		const session = await auth();
		if (!session?.user?.email) {
			return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
		}

		const supabase = await createServerSupabaseClient();
		const { error } = await supabase.from("items").delete().eq("id", params.id);

		if (error) {
			console.error("Item deletion error:", error);
			return NextResponse.json(
				{ error: "アイテムの削除に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ message: "アイテムが削除されました" });
	} catch (error) {
		console.error("API Error:", error);
		return NextResponse.json(
			{ error: "サーバーエラーが発生しました" },
			{ status: 500 },
		);
	}
}
