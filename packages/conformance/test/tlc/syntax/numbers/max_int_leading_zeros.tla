(*---
description: Leading zeros do not count toward the size of a literal.
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE max_int_leading_zeros ----
Test == 00000000002147483647 = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
