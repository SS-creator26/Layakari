"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, getViewer } from "@/lib/supabase/server";
import { LICENCE_KINDS, type LicenceKind } from "@/lib/licensing";
import { academySchema, choreographySchema, compositionSchema, fieldErrors, levelSchema, profileSchema } from "./schemas";
import { fail, friendly, ok, type ActionResult } from "./result";
import { SAMPLE_COMPOSITIONS } from "@/lib/samples";

const uuid = z.string().uuid();

/** Every action starts here: a verified user with a profile. */
async function member() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (!viewer.member) redirect("/onboarding");
  return { viewer, supabase: await createClient() };
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------- profile

export async function saveProfile(_: ActionResult, form: FormData): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  const parsed = profileSchema.safeParse({
    name: form.get("name") ?? "",
    city: form.get("city") ?? "",
    bio: form.get("bio") ?? "",
    roles: form.getAll("roles"),
  });
  if (!parsed.success) return fail("Check the highlighted fields.", fieldErrors(parsed.error));
  const supabase = await createClient();
  const creating = !viewer.member;
  const { error } = creating
    ? await supabase.from("members").insert({ id: viewer.id, ...parsed.data })
    : await supabase.from("members").update(parsed.data).eq("id", viewer.id);
  if (error) return fail(friendly(error));
  revalidateAll();
  if (creating) {
    const roles = parsed.data.roles;
    redirect(roles.includes("composer") ? "/studio?welcome=1" : roles.includes("guru") ? "/academy?welcome=1" : "/compositions?welcome=1");
  }
  redirect("/profile?saved=1");
}

// ---------------------------------------------------------------- compositions

function compositionFromForm(form: FormData) {
  return compositionSchema.safeParse({
    title: form.get("title") ?? "",
    form: form.get("form"),
    taal: form.get("taal"),
    laya: form.get("laya"),
    bpm: form.get("bpm") ?? "",
    bols: form.get("bols") ?? "",
    price_listen: form.get("price_listen") ?? "",
    price_perform: form.get("price_perform") ?? "",
    price_teach: form.get("price_teach") ?? "",
    status: form.get("draft") ? "draft" : "published",
  });
}

export async function saveComposition(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { viewer, supabase } = await member();
  const parsed = compositionFromForm(form);
  if (!parsed.success) return fail("Check the highlighted fields.", fieldErrors(parsed.error));
  const { bols, ...fields } = parsed.data;
  const id = form.get("id");

  let compositionId: string;
  if (typeof id === "string" && id) {
    if (!uuid.safeParse(id).success) return fail("That composition no longer exists.");
    const { error } = await supabase.from("compositions").update(fields).eq("id", id).eq("owner_id", viewer.id);
    if (error) return fail(friendly(error));
    compositionId = id;
  } else {
    const { data, error } = await supabase
      .from("compositions")
      .insert({ ...fields, owner_id: viewer.id })
      .select("id")
      .single();
    if (error || !data) return fail(friendly(error));
    compositionId = data.id;
  }
  const { error: nErr } = await supabase.from("composition_notation").upsert({ composition_id: compositionId, bols });
  if (nErr) return fail(friendly(nErr));
  revalidateAll();
  redirect(`/studio?${id ? "saved" : "published"}=${compositionId}`);
}

export async function deleteComposition(id: string): Promise<ActionResult> {
  const { viewer, supabase } = await member();
  if (!uuid.safeParse(id).success) return fail("That composition no longer exists.");
  const { error } = await supabase.from("compositions").delete().eq("id", id).eq("owner_id", viewer.id);
  if (error) return fail(friendly(error));
  revalidateAll();
  redirect("/studio?deleted=1");
}

export async function addSampleCompositions(): Promise<ActionResult> {
  const { viewer, supabase } = await member();
  for (const s of SAMPLE_COMPOSITIONS) {
    const { bols, ...fields } = s;
    const { data, error } = await supabase
      .from("compositions")
      .insert({ ...fields, owner_id: viewer.id })
      .select("id")
      .single();
    if (error || !data) return fail(friendly(error));
    const { error: nErr } = await supabase.from("composition_notation").insert({ composition_id: data.id, bols });
    if (nErr) return fail(friendly(nErr));
  }
  revalidateAll();
  return ok("Six sample compositions added to your catalogue.");
}

// ---------------------------------------------------------------- choreographies

export async function createChoreography(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { viewer, supabase } = await member();
  const parsed = choreographySchema.safeParse({
    title: form.get("title") ?? "",
    composition_id: form.get("composition_id") ?? "",
    price: form.get("price") ?? "",
    about: form.get("about") ?? "",
  });
  if (!parsed.success) return fail("Check the highlighted fields.", fieldErrors(parsed.error));
  const { error } = await supabase.from("choreographies").insert({ ...parsed.data, owner_id: viewer.id });
  if (error) return fail(friendly(error));
  revalidateAll();
  redirect("/studio?choreography=1");
}

export async function deleteChoreography(id: string): Promise<ActionResult> {
  const { viewer, supabase } = await member();
  if (!uuid.safeParse(id).success) return fail("That choreography no longer exists.");
  const { error } = await supabase.from("choreographies").delete().eq("id", id).eq("owner_id", viewer.id);
  if (error) return fail(friendly(error));
  revalidateAll();
  return ok("Choreography removed.");
}

// ---------------------------------------------------------------- licences (demo checkout)

export async function buyLicence(compositionId: string, kind: LicenceKind): Promise<ActionResult> {
  const { supabase } = await member();
  if (!uuid.safeParse(compositionId).success || !(kind in LICENCE_KINDS)) return fail("That licence isn't available.");
  const { error } = await supabase.rpc("purchase_licence", { p_composition: compositionId, p_kind: kind });
  if (error) return fail(friendly(error));
  revalidateAll();
  return ok(`${LICENCE_KINDS[kind].name} licence added. Demo checkout: no payment taken.`);
}

export async function buyChoreography(choreographyId: string): Promise<ActionResult> {
  const { supabase } = await member();
  if (!uuid.safeParse(choreographyId).success) return fail("That choreography isn't available.");
  const { error } = await supabase.rpc("purchase_choreography", { p_choreography: choreographyId });
  if (error) return fail(friendly(error));
  revalidateAll();
  return ok("Choreography licensed. Demo checkout: no payment taken.");
}

// ---------------------------------------------------------------- academies: students

export async function requestToJoin(academyId: string): Promise<ActionResult> {
  const { viewer, supabase } = await member();
  if (!uuid.safeParse(academyId).success) return fail("That academy no longer exists.");
  const { error } = await supabase.from("enrollments").insert({ academy_id: academyId, student_id: viewer.id });
  if (error) return fail(error.code === "23505" ? "You've already asked to join." : friendly(error));
  revalidateAll();
  return ok("Request sent. The guru will place you in a level.");
}

export async function leaveAcademy(academyId: string): Promise<ActionResult> {
  const { viewer, supabase } = await member();
  if (!uuid.safeParse(academyId).success) return fail("That academy no longer exists.");
  const { error } = await supabase.from("enrollments").delete().eq("academy_id", academyId).eq("student_id", viewer.id);
  if (error) return fail(friendly(error));
  revalidateAll();
  return ok("You've left the academy.");
}

// ---------------------------------------------------------------- academies: guru

async function myAcademy() {
  const ctx = await member();
  const { data } = await ctx.supabase.from("academies").select("id").eq("guru_id", ctx.viewer.id).maybeSingle();
  return { ...ctx, academyId: data?.id ?? null };
}

export async function saveAcademy(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { viewer, supabase, academyId } = await myAcademy();
  const parsed = academySchema.safeParse({ name: form.get("name") ?? "", about: form.get("about") ?? "", fee: form.get("fee") ?? "" });
  if (!parsed.success) return fail("Check the highlighted fields.", fieldErrors(parsed.error));
  if (academyId) {
    const { error } = await supabase.from("academies").update(parsed.data).eq("id", academyId);
    if (error) return fail(friendly(error));
  } else {
    const { data, error } = await supabase
      .from("academies")
      .insert({ ...parsed.data, guru_id: viewer.id })
      .select("id")
      .single();
    if (error || !data) return fail(friendly(error));
    const { error: lErr } = await supabase
      .from("academy_levels")
      .insert(["Prarambhik", "Madhyama", "Visharad"].map((name, position) => ({ academy_id: data.id, name, position })));
    if (lErr) return fail(friendly(lErr));
    if (!viewer.member!.roles.includes("guru")) {
      await supabase.from("members").update({ roles: [...viewer.member!.roles, "guru"] }).eq("id", viewer.id);
    }
  }
  revalidateAll();
  return ok(academyId ? "Academy details saved." : `${parsed.data.name} is ready.`);
}

export async function setAcademyOpen(open: boolean): Promise<ActionResult> {
  const { supabase, academyId } = await myAcademy();
  if (!academyId) return fail("Start your academy first.");
  const { error } = await supabase.from("academies").update({ open }).eq("id", academyId);
  if (error) return fail(friendly(error));
  revalidateAll();
  return ok(open ? "Your academy is taking new students." : "Your academy is closed to new students.");
}

export async function saveLevel(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { supabase, academyId } = await myAcademy();
  if (!academyId) return fail("Start your academy first.");
  const parsed = levelSchema.safeParse({ name: form.get("name") ?? "" });
  if (!parsed.success) return fail("Check the level name.", fieldErrors(parsed.error));
  const id = form.get("id");
  if (typeof id === "string" && id) {
    const { error } = await supabase.from("academy_levels").update(parsed.data).eq("id", id).eq("academy_id", academyId);
    if (error) return fail(friendly(error));
    revalidateAll();
    return ok("Level renamed.");
  }
  const { data: last } = await supabase
    .from("academy_levels")
    .select("position")
    .eq("academy_id", academyId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("academy_levels")
    .insert({ academy_id: academyId, name: parsed.data.name, position: (last?.position ?? -1) + 1 })
    .select("id")
    .single();
  if (error || !data) return fail(friendly(error));
  revalidateAll();
  redirect(`/academy?level=${data.id}`);
}

export async function deleteLevel(levelId: string): Promise<ActionResult> {
  const { supabase, academyId } = await myAcademy();
  if (!academyId || !uuid.safeParse(levelId).success) return fail("That level no longer exists.");
  const { error } = await supabase.from("academy_levels").delete().eq("id", levelId).eq("academy_id", academyId);
  if (error) return fail(friendly(error));
  revalidateAll();
  return ok("Level deleted. Its students moved to the first level.");
}

export async function setPieceReleased(levelId: string, compositionId: string, released: boolean): Promise<ActionResult> {
  const { supabase } = await member();
  if (!uuid.safeParse(levelId).success || !uuid.safeParse(compositionId).success) return fail("That piece no longer exists.");
  const { error } = released
    ? await supabase.from("level_pieces").upsert({ level_id: levelId, composition_id: compositionId }, { ignoreDuplicates: true })
    : await supabase.from("level_pieces").delete().eq("level_id", levelId).eq("composition_id", compositionId);
  if (error) return fail(error.code === "42501" ? "You need a Teach licence to release this piece." : friendly(error));
  revalidateAll();
  return ok(released ? "Released to this level." : "Removed from this level.");
}

export async function placeStudent(studentId: string, levelId: string): Promise<ActionResult> {
  const { supabase, academyId } = await myAcademy();
  if (!academyId || !uuid.safeParse(studentId).success || !uuid.safeParse(levelId).success) return fail("Choose a level.");
  const { data, error } = await supabase
    .from("enrollments")
    .update({ status: "active", level_id: levelId })
    .eq("academy_id", academyId)
    .eq("student_id", studentId)
    .select("student_id");
  if (error) return fail(friendly(error));
  if (!data?.length) return fail("That student has withdrawn their request.");
  revalidateAll();
  return ok("Student placed.");
}

export async function declineStudent(studentId: string): Promise<ActionResult> {
  const { supabase, academyId } = await myAcademy();
  if (!academyId || !uuid.safeParse(studentId).success) return fail("That request no longer exists.");
  const { error } = await supabase
    .from("enrollments")
    .update({ status: "declined", level_id: null })
    .eq("academy_id", academyId)
    .eq("student_id", studentId);
  if (error) return fail(friendly(error));
  revalidateAll();
  return ok("Request declined.");
}

export async function removeStudent(studentId: string): Promise<ActionResult> {
  const { supabase, academyId } = await myAcademy();
  if (!academyId || !uuid.safeParse(studentId).success) return fail("That student is no longer enrolled.");
  const { error } = await supabase.from("enrollments").delete().eq("academy_id", academyId).eq("student_id", studentId);
  if (error) return fail(friendly(error));
  revalidateAll();
  return ok("Student removed.");
}
