(*---
description: A separator may sit in a recursive section.
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE section_allows_separator ----
RECURSIVE F
----
F == 1
Test == F = 1
====

(*--- recorded
all:
  exit: 0
---*)
