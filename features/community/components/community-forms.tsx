"use client";

import { useActionState } from "react";
import { createChallengeAction, createEventAction, createGroupAction, createListingAction, createPostAction } from "@/actions/community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState = { ok: false, message: "" };
type Option = { id: string; name: string };

function Select({ name, label, children, required }: { name: string; label: string; children: React.ReactNode; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><select name={name} required={required} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">{children}</select></label>;
}

function Textarea({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><textarea name={name} required={required} rows={4} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark" /></label>;
}

export function PostForm({ groups }: { groups: Option[] }) {
  const [state, action, pending] = useActionState(createPostAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Select name="type" label="Post Type" required><option value="UPDATE">Update</option><option value="PROJECT_MILESTONE">Project Milestone</option><option value="ACHIEVEMENT">Achievement</option><option value="QUESTION">Question</option><option value="RESOURCE">Resource</option></Select><Select name="groupId" label="Group"><option value="">Community Feed</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</Select><Input name="tags" label="Tags" /></div><Input name="title" label="Title" required /><Textarea name="content" label="What do you want to share?" required /><Input name="resourceUrl" label="Resource URL" type="url" /><Button disabled={pending}>{pending ? "Sharing..." : "Share Post"}</Button></form>;
}

export function GroupForm() {
  const [state, action, pending] = useActionState(createGroupAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-2"><Input name="name" label="Group Name" required /><Select name="type" label="Group Type" required><option value="INTEREST">Interest Group</option><option value="BATCH">Batch Group</option><option value="PROGRAM">Program Group</option><option value="FOUNDER_CLUB">Founder Club</option><option value="CODING_CLUB">Coding Club</option><option value="AI_CLUB">AI Club</option><option value="PLACEMENT_CLUB">Placement Club</option></Select></div><Textarea name="description" label="Description" /><Button disabled={pending}>Create Group</Button></form>;
}

export function EventForm({ groups }: { groups: Option[] }) {
  const [state, action, pending] = useActionState(createEventAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Select name="type" label="Event Type" required><option value="WORKSHOP">Workshop</option><option value="LIVE_SESSION">Live Session</option><option value="HACKATHON">Hackathon</option><option value="MEETUP">Meetup</option><option value="BOOTCAMP">Bootcamp</option><option value="CAREER_FAIR">Career Fair</option><option value="GUEST_LECTURE">Guest Lecture</option></Select><Select name="groupId" label="Group"><option value="">Open event</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</Select><Input name="startsAt" label="Start Time" type="datetime-local" required /></div><div className="grid gap-4 md:grid-cols-2"><Input name="title" label="Title" required /><Input name="capacity" label="Capacity" type="number" /></div><Textarea name="description" label="Description" /><Input name="meetingLink" label="Meeting Link" type="url" /><Button disabled={pending}>Create Event</Button></form>;
}

export function ChallengeForm({ groups }: { groups: Option[] }) {
  const [state, action, pending] = useActionState(createChallengeAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><Select name="groupId" label="Group"><option value="">Open challenge</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</Select><Input name="title" label="Challenge Title" required /><Textarea name="description" label="Description" required /><div className="grid gap-4 md:grid-cols-2"><Input name="rewardXp" label="Reward XP" type="number" defaultValue={0} /><Input name="rewardCoins" label="Reward Coins" type="number" defaultValue={0} /></div><Button disabled={pending}>Create Challenge</Button></form>;
}

export function ListingForm() {
  const [state, action, pending] = useActionState(createListingAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Select name="type" label="Listing Type" required><option value="TEMPLATE">Template</option><option value="PROJECT">Project</option><option value="PROMPT_PACK">Prompt Pack</option><option value="DESIGN_ASSET">Design Asset</option><option value="LEARNING_RESOURCE">Learning Resource</option><option value="SERVICE">Service</option></Select><Input name="categoryName" label="Category" required /><Input name="priceCoins" label="Skill Coins" type="number" defaultValue={0} /></div><Input name="title" label="Title" required /><Textarea name="description" label="Description" required /><Input name="url" label="Listing URL" type="url" /><Button disabled={pending}>Submit Listing</Button></form>;
}
