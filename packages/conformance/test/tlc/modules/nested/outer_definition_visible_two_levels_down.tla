(*---
description: A doubly nested module sees the outermost definitions.
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [nested]
flags: [expression]
outcome: success
---*)
---- MODULE outer_definition_visible_two_levels_down ----
Z == 9
---- MODULE A ----
---- MODULE B ----
V == Z
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
