export const dynamic = "force-dynamic";
export const revalidate = 0;
import { getIndicatie, updateIndicatie } from "../../_indicaties";
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return getIndicatie(id);
}
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return updateIndicatie(req, id);
}
