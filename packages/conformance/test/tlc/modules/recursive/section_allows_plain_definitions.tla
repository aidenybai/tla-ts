(*---
description: Ordinary definitions may sit in a recursive section.
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE section_allows_plain_definitions ----
RECURSIVE F
G == 1
F == G
Test == F = 1
====

(*--- recorded
all:
  exit: 0
---*)
