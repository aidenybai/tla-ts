(*---
description: "A nested module sees constants that come before it, with no substitution needed."
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [nested]
flags: [expression]
config: |
  CONSTANT c = 7
outcome: success
---*)
---- MODULE inner_sees_outer_constant ----
CONSTANT c
---- MODULE I ----
B == c
====
INSTANCE I
Test == B = 7
====

(*--- recorded
all:
  exit: 0
---*)
