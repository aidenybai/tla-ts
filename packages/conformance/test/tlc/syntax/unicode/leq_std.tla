(*---
description: "≤ works as \\leq from Naturals."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE leq_std ----
EXTENDS Naturals
Test == 1 ≤ 2
====

(*--- recorded
all:
  exit: 0
---*)
