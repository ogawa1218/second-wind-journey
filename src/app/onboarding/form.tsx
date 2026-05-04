"use client";

import { useActionState } from "react";
import { submitOnboarding, type OnboardingFormState } from "@/actions/onboarding";

const initialState: OnboardingFormState = { ok: true };

export default function OnboardingForm() {
  const [state, formAction, pending] = useActionState(submitOnboarding, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <Field label="表示名" htmlFor="displayName">
        <input
          id="displayName"
          name="displayName"
          required
          maxLength={50}
          placeholder="マーシー"
          className={inputCls}
        />
      </Field>

      <Field label="性別" htmlFor="gender">
        <select id="gender" name="gender" required defaultValue="" className={inputCls}>
          <option value="" disabled>選択してください</option>
          <option value="male">男性</option>
          <option value="female">女性</option>
          <option value="other">その他</option>
        </select>
      </Field>

      <Field label="生年月日" htmlFor="birthDate">
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          required
          className={inputCls}
        />
      </Field>

      <Field label="身長 (cm)" htmlFor="heightCm">
        <input
          id="heightCm"
          name="heightCm"
          type="number"
          step="0.1"
          min="50"
          max="250"
          required
          placeholder="172"
          className={inputCls}
        />
      </Field>

      <Field
        label="目標フルマラソンタイム（秒、任意）"
        htmlFor="targetFullMarathonSeconds"
        hint="サブ3 = 10800、サブ3.5 = 12600"
      >
        <input
          id="targetFullMarathonSeconds"
          name="targetFullMarathonSeconds"
          type="number"
          min="0"
          placeholder="10800"
          className={inputCls}
        />
      </Field>

      <Field label="AIコーチの口調" htmlFor="coachTone" hint="あとから変更できます">
        <select
          id="coachTone"
          name="coachTone"
          required
          defaultValue="coach"
          className={inputCls}
        >
          <option value="coach">コーチ（落ち着き、デフォルト）</option>
          <option value="spartan">スパルタ（熱い）</option>
          <option value="supporter">サポーター（共感重視）</option>
        </select>
      </Field>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "保存中..." : "保存して始める"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500";
