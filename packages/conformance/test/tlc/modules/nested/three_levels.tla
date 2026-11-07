(*---
description: Nesting may go deeper than one level.
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [nested]
flags: [expression]
outcome: success
---*)
---- MODULE three_levels ----
---- MODULE A ----
---- MODULE B ----
---- MODULE C ----
V == 9
====
INSTANCE C
====
INSTANCE B
====
INSTANCE A
Test == V = 9
====

(*--- recorded
all:
  exit: 0
---*)
