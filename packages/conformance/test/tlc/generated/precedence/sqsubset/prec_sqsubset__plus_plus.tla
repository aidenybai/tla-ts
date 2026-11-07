(*---
description: Groups \sqsubset against ++, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsubset__plus_plus ----
EXTENDS TLC
a \sqsubset b == <<"\\sqsubset", a, b>>
a ++ b == <<"++", a, b>>
Test == PrintT(1 \sqsubset 2 ++ 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsubset", 1, <<"++", 2, 3>>>>'
---*)
