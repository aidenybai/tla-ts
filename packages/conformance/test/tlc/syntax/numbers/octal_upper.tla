(*---
description: "\\O17 is the upper case spelling of octal."
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE octal_upper ----
Test == \O17 = 15
====

(*--- recorded
all:
  exit: 0
---*)
