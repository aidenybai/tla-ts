(*---
description: "÷ works as \\div from Naturals."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE div_std ----
EXTENDS Naturals
Test == 7 ÷ 2 = 3
====

(*--- recorded
all:
  exit: 0
---*)
