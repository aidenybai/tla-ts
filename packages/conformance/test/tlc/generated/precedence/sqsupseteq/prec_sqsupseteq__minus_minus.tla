(*---
description: Groups \sqsupseteq against --, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsupseteq__minus_minus ----
EXTENDS TLC
a \sqsupseteq b == <<"\\sqsupseteq", a, b>>
a -- b == <<"--", a, b>>
Test == PrintT(1 \sqsupseteq 2 -- 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsupseteq", 1, <<"--", 2, 3>>>>'
---*)
