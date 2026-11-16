(*---
description: Leading zeros are allowed in an octal literal.
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE octal_leading_zeros ----
Test == \o007 = 7
====

(*--- recorded
all:
  exit: 0
---*)
