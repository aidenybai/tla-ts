(*---
description: "-1 is prefix minus applied to 1."
ref: "tla2sany/parser/Operators.java#getMixfix"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE negative_literal_is_prefix_minus ----
EXTENDS Integers
Test == -1 + 2 = 1
====

(*--- recorded
all:
  exit: 0
---*)
