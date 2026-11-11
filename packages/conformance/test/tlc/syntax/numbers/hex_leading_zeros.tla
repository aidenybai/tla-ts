(*---
description: Leading zeros are allowed in a hex literal.
ref: "tla2sany/semantic/NumeralNode.java#NumeralNode"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE hex_leading_zeros ----
Test == \h000a = 10
====

(*--- recorded
all:
  exit: 0
---*)
