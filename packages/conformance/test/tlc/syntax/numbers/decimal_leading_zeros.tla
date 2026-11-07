(*---
description: Leading zeros do not make a literal octal.
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE decimal_leading_zeros ----
Test == 007 = 7
====

(*--- recorded
all:
  exit: 0
---*)
