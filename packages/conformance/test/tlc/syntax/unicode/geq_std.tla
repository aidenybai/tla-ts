(*---
description: "≥ works as \\geq from Naturals."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE geq_std ----
EXTENDS Naturals
Test == 2 ≥ 1
====

(*--- recorded
all:
  exit: 0
---*)
