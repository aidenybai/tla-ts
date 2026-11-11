(*---
description: Leading zeros are allowed in a binary literal.
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE binary_leading_zeros ----
Test == \b0001 = 1
====

(*--- recorded
all:
  exit: 0
---*)
