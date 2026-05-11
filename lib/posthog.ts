"use client";

import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  if (!key) return;
  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
  });
  initialized = true;
}

export function identifyUser(userId: string, email?: string | null) {
  if (!initialized) return;
  posthog.identify(userId, email ? { email } : undefined);
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function resetPostHog() {
  if (!initialized) return;
  posthog.reset();
}
