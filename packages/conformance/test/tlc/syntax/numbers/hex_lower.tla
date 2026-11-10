(*---
description: "\\hfF reads as hex with digits in any case."
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE hex_lower ----
Test == \hfF = 255
====

(*--- recorded
all:
  exit: 0
---*)
