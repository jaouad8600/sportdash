export const dynamic = "force-dynamic";
export const revalidate = 0;
import { listEvaluaties, createEvaluatie } from "../../../_indicaties";
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return listEvaluaties(id);
}
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return createEvaluatie(req, id);
}
