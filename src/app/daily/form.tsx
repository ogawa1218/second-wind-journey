"use client";

import { useActionState } from "react";
import {
  submitDailyRecord,
  type DailyRecordFormState,
} from "@/actions/daily-record";

interface Defaults {
  weightKg: number | null;
  sleepHours: number | null;
  sleepQuality: number | null;
  mood: number | null;
  bodyFatPercent: number | null;
  restingHeartRate: number | null;
  note: string | null;
}

const initialState: DailyRecordFormState = { ok: true };

export default function DailyRecordForm({
  recordDate,
  defaults,
}: {
  recordDate: string;
  defaults: Defaults;
}) {
  const [state, formAction, pending] = useActionState(
    submitDailyRecord,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="recordDate" value={recordDate} />

      <Field label="体重 (kg)" htmlFor="weightKg">
        <input
          id="weightKg"
          name="weightKg"
          type="number"
          step="0.1"
          min="0"
          max="500"
          defaultValue={defaults.weightKg ?? ""}
          placeholder="68.5"
          className={inputCls}
        />
      </Field>

      <Field label="睡眠時間 (h)" htmlFor="sleepHours">
        <input
          id="sleepHours"
          name="sleepHours"
          type="number"
          step="0.1"
          min="0"
          max="24"
          defaultValue={defaults.sleepHours ?? ""}
          placeholder="7.0"
          className={inputCls}
        />
      </Field>

      <Scale1to5
        name="sleepQuality"
        label="睡眠の質"
        defaultValue={defaults.sleepQuality}
      />

      <Scale1to5 name="mood" label="気分" defaultValue={defaults.mood} />

      <Field label="体脂肪率 (%、任意)" htmlFor="bodyFatPercent">
        <input
          id="bodyFatPercent"
          name="bodyFatPercent"
          type="number"
          step="0.1"
          min="0"
          max="99"
          defaultValue={defaults.bodyFatPercent ?? ""}
          placeholder="13.0"
          className={inputCls}
        />
      </Field>

      <Field
        label="安静時心拍 (bpm、任意)"
        htmlFor="restingHeartRate"
        hint="朝起きた直後の値を測ると正確です"
      >
        <input
          id="restingHeartRate"
          name="restingHeartRate"
          type="number"
          step="1"
          min="0"
          max="300"
          defaultValue={defaults.restingHeartRate ?? ""}
          placeholder="52"
          className={inputCls}
        />
      </Field>

      <Field label="メモ（任意）" htmlFor="note">
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          defaultValue={defaults.note ?? ""}
          placeholder="今日の気づき、体調、走った感想など"
          className={inputCls}
        />
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
        {pending ? "保存中..." : "保存"}
      </button>
    </form>
  );
}

function Scale1to5({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number | null;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </legend>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <label
            key={v}
            className="flex-1 cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center text-sm transition has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white dark:border-zinc-700 dark:bg-zinc-900 dark:has-[:checked]:border-white dark:has-[:checked]:bg-white dark:has-[:checked]:text-zinc-900"
          >
            <input
              type="radio"
              name={name}
              value={v}
              defaultChecked={defaultValue === v}
              className="sr-only"
            />
            {v}
          </label>
        ))}
      </div>
    </fieldset>
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
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500";
