import Link from "next/link";
import { Boxes, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateLabsProductForm } from "@/features/labs/components/labs-forms";
import { getLabsCatalogData, getLabsCreateOptions } from "@/server/labs/queries";

export default async function LabsCatalogPage() {
  const data = await getLabsCatalogData();
  const rawOptions = data.canCreate ? await getLabsCreateOptions() : null;
  const options = rawOptions ? {
    institutions: rawOptions[0], divisions: rawOptions[1], districts: rawOptions[2], campuses: rawOptions[3], departments: rawOptions[4],
    employees: rawOptions[5].map((employee) => ({ id: employee.id, name: `${employee.user.name}${employee.employeeCode ? ` (${employee.employeeCode})` : ""}` }))
  } : null;
  return <div className="space-y-10"><header><p className="text-sm font-black uppercase text-brand-red">AIRA Labs</p><h1 className="mt-3 text-4xl font-black text-brand-dark">Product Catalog</h1><p className="mt-3 max-w-3xl font-semibold leading-7 text-brand-muted">Authoritative product identity, lifecycle, organization, and Employee ownership.</p></header>{options ? <Card><CardContent className="p-6 md:p-8"><div className="mb-6 flex items-center gap-3"><Plus className="h-5 w-5 text-brand-red" /><h2 className="text-xl font-black">Register Product</h2></div><CreateLabsProductForm options={options} /></CardContent></Card> : null}<section><h2 className="mb-5 text-2xl font-black text-brand-dark">Registered Products</h2>{data.products.length === 0 ? <Card><CardContent className="flex min-h-40 items-center gap-4 p-6"><Boxes className="h-8 w-8 text-brand-red" /><p className="font-bold text-brand-muted">No Labs products are registered. Existing product names were not guessed or imported.</p></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.products.map((product) => <Card key={product.id}><CardContent className="p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-brand-red">{product.code}</p><h3 className="mt-2 text-xl font-black text-brand-dark">{product.name}</h3></div><span className="rounded-full bg-brand-beige px-3 py-1 text-xs font-black text-brand-dark">{product.lifecycle}</span></div><p className="mt-3 line-clamp-3 font-semibold text-brand-muted">{product.description}</p><dl className="mt-5 grid gap-2 text-sm font-bold text-brand-muted"><div>Type: <span className="text-brand-dark">{product.type.replaceAll("_", " ")}</span></div><div>Division: <span className="text-brand-dark">{product.division.name}</span></div><div>Owner: <span className="text-brand-dark">{product.assignments[0]?.employee.user.name ?? "Owner review required"}</span></div></dl><Button asChild variant="secondary" className="mt-5"><Link href={`/labs/${product.code}`}>Open Product</Link></Button></CardContent></Card>)}</div>}</section></div>;
}
