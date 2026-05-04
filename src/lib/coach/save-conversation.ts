import { supabaseAdmin } from "@/lib/supabase/server";
import { calculateCostUsd } from "./budget";
import type { Database } from "@/lib/supabase/database.types";

type AiKind = Database["public"]["Enums"]["ai_kind_type"];
type AiRole = Database["public"]["Enums"]["ai_role_type"];

export interface SaveConversationArgs {
  userId: string;
  kind: AiKind;
  role: AiRole;
  content: string;
  contextData?: unknown;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Insert a single ai_conversations row, computing cost_usd from token counts.
 */
export async function saveConversation(args: SaveConversationArgs) {
  const { userId, kind, role, content, contextData, model, inputTokens, outputTokens } = args;

  const costUsd =
    inputTokens != null && outputTokens != null
      ? Number(calculateCostUsd(inputTokens, outputTokens).toFixed(6))
      : null;

  const { error } = await supabaseAdmin.from("ai_conversations").insert({
    user_id: userId,
    kind,
    role,
    content,
    context_data: (contextData ?? null) as Database["public"]["Tables"]["ai_conversations"]["Insert"]["context_data"],
    model: model ?? null,
    input_tokens: inputTokens ?? null,
    output_tokens: outputTokens ?? null,
    cost_usd: costUsd,
  });

  if (error) throw error;
}
