"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	searchKey?: string;
	searchPlaceholder?: string;
	emptyStateMessage?: string;
	emptyStateComponent?: React.ReactNode;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	searchKey,
	searchPlaceholder = "検索...",
	emptyStateMessage = "データがありません",
	emptyStateComponent,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		state: {
			sorting,
			columnFilters,
		},
	});

	return (
		<div className="space-y-4">
			{searchKey && (
				<div className="flex items-center">
					<Input
						placeholder={searchPlaceholder}
						value={
							(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
						}
						onChange={(event) =>
							table.getColumn(searchKey)?.setFilterValue(event.target.value)
						}
						className="max-w-sm"
					/>
				</div>
			)}
			<div className="rounded-md border">
				<table className="w-full">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id} className="border-b">
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<tr
									key={row.id}
									className="border-b transition-colors hover:bg-muted/50"
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="p-4 align-middle">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									))}
								</tr>
							))
						) : (
							<tr>
								<td colSpan={columns.length} className="h-24 p-0">
									{emptyStateComponent || (
										<div className="text-center text-muted-foreground py-8">
											{emptyStateMessage}
										</div>
									)}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
			<div className="flex items-center justify-between space-x-2">
				<div className="text-sm text-muted-foreground">
					{table.getFilteredRowModel().rows.length} 件中{" "}
					{table.getState().pagination.pageIndex *
						table.getState().pagination.pageSize +
						1}
					-
					{Math.min(
						(table.getState().pagination.pageIndex + 1) *
							table.getState().pagination.pageSize,
						table.getFilteredRowModel().rows.length,
					)}{" "}
					件を表示
				</div>
				<div className="space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						前へ
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						次へ
					</Button>
				</div>
			</div>
		</div>
	);
}
