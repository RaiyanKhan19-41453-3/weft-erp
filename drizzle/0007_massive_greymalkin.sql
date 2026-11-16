CREATE TABLE "rate_limit_events" (
	"key" text NOT NULL,
	"window_start" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "rate_limit_events_key_window_start_pk" PRIMARY KEY("key","window_start")
);
