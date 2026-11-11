(*---
description: "\\B101 is the upper case spelling of binary."
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE binary_upper ----
Test == \B101 = 5
====

(*--- recorded
all:
  exit: 0
---*)
