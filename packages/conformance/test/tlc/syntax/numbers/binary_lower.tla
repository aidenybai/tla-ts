(*---
description: "\\b101 reads as binary."
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE binary_lower ----
Test == \b101 = 5
====

(*--- recorded
all:
  exit: 0
---*)
