export const dynamic = "force-dynamic";
export const revalidate = 0;
import { archiveIndicatie } from "../../../_indicaties";
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return archiveIndicatie(req, id);
}
