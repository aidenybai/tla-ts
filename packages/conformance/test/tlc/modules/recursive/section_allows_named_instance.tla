(*---
description: A named INSTANCE may sit in a recursive section.
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE section_allows_named_instance ----
---- MODULE I ----
A == 1
====
RECURSIVE F
M == INSTANCE I
F == M!A
Test == F = 1
====

(*--- recorded
all:
  exit: 0
---*)
