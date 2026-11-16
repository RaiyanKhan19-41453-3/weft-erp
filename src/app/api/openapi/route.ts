const spec = {
  openapi: "3.1.0",
  info: {
    title: "Weft ERP API",
    version: "1.0.0",
    description: "Order, material, workflow and document API for the Weft demo ERP.",
  },
  servers: [{ url: "/" }],
  paths: {
    "/api/orders": {
      get: {
        summary: "List orders for the active tenant",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 50 } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "sort", in: "query", schema: { type: "string" } },
          { name: "dir", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
        ],
        responses: { "200": { description: "Paged order list" } },
      },
      post: {
        summary: "Create a purchase order",
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Replaying the same key returns the original response.",
          },
        ],
        responses: { "201": { description: "Created" }, "422": { description: "Validation error" } },
      },
    },
    "/api/orders/query": {
      get: {
        summary: "Server-driven paging, sorting, filtering and full-text search",
        responses: { "200": { description: "Paged order list" } },
      },
    },
    "/api/orders/{id}/status": {
      post: {
        summary: "Request or apply a governed status transition",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Applied" }, "202": { description: "Approval requested" }, "422": { description: "Illegal transition" } },
      },
    },
    "/api/orders/{id}/invoices": {
      post: {
        summary: "Create an immutable invoice version",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "201": { description: "Invoice snapshot created" } },
      },
    },
    "/api/materials/{sku}/receipts": {
      post: {
        summary: "Record a goods receipt and recalculate coverage",
        parameters: [{ name: "sku", in: "path", required: true, schema: { type: "string" } }],
        responses: { "201": { description: "Receipt recorded" } },
      },
    },
  },
};

export function GET() {
  return Response.json(spec, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
