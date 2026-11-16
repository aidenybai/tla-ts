(*---
description: Groups \sqsubset against \wr, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsubset__wr ----
EXTENDS TLC
a \sqsubset b == <<"\\sqsubset", a, b>>
a \wr b == <<"\\wr", a, b>>
Test == PrintT(1 \sqsubset 2 \wr 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsubset", 1, <<"\\wr", 2, 3>>>>'
---*)
