import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	LoadingDisplay,
	LoadingSpinner,
} from "@/components/ui/loading-display";

describe("LoadingDisplay", () => {
	it("デフォルトメッセージでカード形式でレンダリングされる", () => {
		render(<LoadingDisplay />);

		expect(screen.getByText("読み込み中...")).toBeInTheDocument();
	});

	it("カスタムメッセージが表示される", () => {
		const customMessage = "データを取得中...";
		render(<LoadingDisplay message={customMessage} />);

		expect(screen.getByText(customMessage)).toBeInTheDocument();
	});

	it("inline バリアントで正しくレンダリングされる", () => {
		render(<LoadingDisplay variant="inline" message="読み込み中" />);

		expect(screen.getByText("読み込み中")).toBeInTheDocument();
	});

	it("page バリアントで正しくレンダリングされる", () => {
		render(<LoadingDisplay variant="page" message="ページ読み込み中" />);

		expect(screen.getByText("ページ読み込み中")).toBeInTheDocument();
	});

	it("overlay バリアントで正しくレンダリングされる", () => {
		render(<LoadingDisplay variant="overlay" message="処理中..." />);

		expect(screen.getByText("処理中...")).toBeInTheDocument();
	});

	it("カスタムクラス名が適用される", () => {
		const { container } = render(<LoadingDisplay className="custom-class" />);

		expect(container.firstChild).toHaveClass("custom-class");
	});

	it("異なるサイズが正しく適用される", () => {
		render(<LoadingDisplay size="lg" />);

		// LoadingDisplayは内部でLoader2アイコンを使用
		expect(document.querySelector(".animate-spin")).toBeInTheDocument();
		// 大きいサイズのクラスが適用されているかを確認
		expect(document.querySelector(".h-8")).toBeInTheDocument();
	});
});

describe("LoadingSpinner", () => {
	it("デフォルトサイズでレンダリングされる", () => {
		render(<LoadingSpinner />);

		const spinner = document.querySelector(".animate-spin");
		expect(spinner).toBeInTheDocument();
	});

	it("小さいサイズでレンダリングされる", () => {
		render(<LoadingSpinner size="sm" />);

		const spinner = document.querySelector(".h-4.w-4");
		expect(spinner).toBeInTheDocument();
	});

	it("大きいサイズでレンダリングされる", () => {
		render(<LoadingSpinner size="lg" />);

		const spinner = document.querySelector(".h-8.w-8");
		expect(spinner).toBeInTheDocument();
	});

	it("カスタムクラス名が適用される", () => {
		render(<LoadingSpinner className="text-blue-500" />);

		const spinner = document.querySelector(".text-blue-500");
		expect(spinner).toBeInTheDocument();
	});
});
