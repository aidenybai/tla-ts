(*---
description: "\\o17 reads as octal."
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE octal_lower ----
Test == \o17 = 15
====

(*--- recorded
all:
  exit: 0
---*)
