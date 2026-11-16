(*---
description: The largest int literal TLC holds.
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE max_int ----
Test == 2147483647 = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
