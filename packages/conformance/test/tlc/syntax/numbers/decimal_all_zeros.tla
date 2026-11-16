(*---
description: A literal of all zeros is zero.
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE decimal_all_zeros ----
Test == 000 = 0
====

(*--- recorded
all:
  exit: 0
---*)
