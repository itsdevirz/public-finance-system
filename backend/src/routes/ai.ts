import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { JournalDocument } from "../db/types.js";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Hono();

// Load RAG Data
let sanamaCodes: any = { groups: [] };
try {
  const codesData = fs.readFileSync(
    path.join(__dirname, "../data/sanamaCodes.json"),
    "utf-8",
  );
  sanamaCodes = JSON.parse(codesData);
} catch (e) {
  console.error("Failed to load sanamaCodes.json", e);
}

// Flatten accounting codes for simple search
const FLAT_ACCOUNTS: any[] = [];
sanamaCodes.groups.forEach((g: any) => {
  g.accounts?.forEach((acc: any) => {
    FLAT_ACCOUNTS.push({ code: acc.code, title: acc.title, type: "General" });
    acc.children?.forEach((child: any) => {
      FLAT_ACCOUNTS.push({
        code: child.code,
        title: child.title,
        type: "Detail",
        nature: child.nature,
      })
    });
  });
});

const BANKS = [
  { bank: "بانک ملت", branch: "ولیعصر", code: "010" },
  { bank: "بانک ملی", branch: "مرکزی", code: "020" },
  { bank: "بانک سامان", branch: "ونک", code: "030" },
];

// Define tools logic
const tools = {
  createVoucher: async (args: any) => {
    try {
      const doc: JournalDocument = {
        document_number: `VCH-${Date.now()}`,
        document_type: args.document_type || "GENERAL_PAYMENT",
        status: "DRAFT",
        fiscal_year: new Date().getFullYear(),
        document_date: new Date().toISOString(),
        description: args.description,
        lines: args.lines || [],
      };

      const db = getDb();
      const result = await db.collection("journal_documents").insertOne(doc);
      return {
        success: true,
        message: "Voucher created",
        id: result.insertedId,
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  searchAccount: async (args: { query: string }) => {
    const q = args.query.toLowerCase();
    return FLAT_ACCOUNTS.filter(
      (a) => a.title.toLowerCase().includes(q) || a.code.includes(q),
    ).slice(0, 10);
  },
  validateEntry: async (args: { lines: any[] }) => {
    const lines = args.lines || [];
    let debit = 0;
    let credit = 0;
    for (const line of lines) {
      debit += line.debit || 0;
      credit += line.credit || 0;
    }
    const isBalanced = debit === credit;
    return { isBalanced, totalDebit: debit, totalCredit: credit };
  },
  findBankBranch: async (args: { bank: string; branch?: string }) => {
    return BANKS.filter(
      (b) =>
        b.bank.includes(args.bank) &&
        (!args.branch || b.branch.includes(args.branch)),
    );
  },
};

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY ||
  "your api key";

router.post("/chat", async (c) => {
  try {
    const body = await c.req.json();
    const messages = body.messages || [];

    const toolsDefinition = [
      {
        type: "function",
        function: {
          name: "createVoucher",
          description:
            "Create a financial voucher/journal entry. Requires an array of lines with debit/credit.",
          parameters: {
            type: "object",
            properties: {
              document_type: { type: "string" },
              description: { type: "string" },
              lines: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    account_code: { type: "string" },
                    debit: { type: "number" },
                    credit: { type: "number" },
                  },
                },
              },
            },
            required: ["description", "lines"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "searchAccount",
          description: "Search for accounting codes by name or code",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" },
            },
            required: ["query"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "validateEntry",
          description: "Validate if debit equals credit",
          parameters: {
            type: "object",
            properties: {
              lines: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    debit: { type: "number" },
                    credit: { type: "number" },
                  },
                },
              },
            },
            required: ["lines"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "findBankBranch",
          description: "Find bank branch code",
          parameters: {
            type: "object",
            properties: {
              bank: { type: "string" },
              branch: { type: "string" },
            },
            required: ["bank"],
          },
        },
      },
    ];

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen/qwen-2.5-72b-instruct",
          messages: [
            {
              role: "system",
              content: `You are an AI assistant for a financial and accounting system.
You must always produce structured reasoning before actions.

Respond with a JSON object at the beginning of your message inside a \`\`\`json block, containing:
{
  "intent": "e.g., create_voucher",
  "extracted": { "amount": 10000, "bank": "..." },
  "missing_fields": [],
  "actions": [],
  "files_to_modify": []
}
Then provide your natural language response to the user.
Always validate financial operations before execution. Never guess accounting codes (use searchAccount).`,
            },
            ...messages,
          ],
          tools: toolsDefinition,
          tool_choice: "auto",
          temperature: 0.1,
        }),
      },
    );

    const data = await response.json();

    const choice = data.choices[0];
    if (choice.message.tool_calls) {
      const results = [];
      for (const call of choice.message.tool_calls) {
        const fnName = call.function.name as keyof typeof tools;
        const fnArgs = JSON.parse(call.function.arguments);
        if (tools[fnName]) {
          const res = await tools[fnName](fnArgs);
          results.push({ tool: fnName, args: fnArgs, result: res });
        }
      }

      return c.json({
        role: "assistant",
        content: `Executed tools: ${results.map((r) => r.tool).join(", ")}`,
        tool_results: results,
        internal_reasoning: {
          intent: "tool_execution",
          actions: results,
        },
      });
    }

    let contentStr = choice.message.content || "";
    let reasoning = null;
    const jsonMatch = contentStr.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        reasoning = JSON.parse(jsonMatch[1]);
        contentStr = contentStr.replace(jsonMatch[0], "").trim();
      } catch (e) {}
    }

    return c.json({
      role: "assistant",
      content: contentStr,
      internal_reasoning: reasoning,
    });
  } catch (error: any) {
    console.error("AI Error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default router;
