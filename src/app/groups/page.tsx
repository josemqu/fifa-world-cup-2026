import { redirect } from "next/navigation";

export default function GroupsPage() {
  redirect("/fixture?tab=groups");
}
