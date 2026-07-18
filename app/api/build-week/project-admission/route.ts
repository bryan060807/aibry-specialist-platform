import {
  resetBuildWeekDemo,
  runProjectAdmissionWalkingSkeleton,
} from "@/lib/build-week/project-admission-walking-skeleton";

type BuildWeekRequest = {
  action?: "run" | "reset";
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as BuildWeekRequest;
  const result =
    body.action === "reset"
      ? resetBuildWeekDemo()
      : await runProjectAdmissionWalkingSkeleton();

  return Response.json(result, {
    status: result.ok ? 200 : 409,
    headers: { "cache-control": "no-store" },
  });
}
