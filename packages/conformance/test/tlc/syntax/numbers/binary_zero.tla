(*---
description: "\\b0 is zero."
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE binary_zero ----
Test == \b0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
