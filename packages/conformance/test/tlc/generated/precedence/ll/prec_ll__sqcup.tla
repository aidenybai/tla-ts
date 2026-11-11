(*---
description: Groups \ll against \sqcup, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_ll__sqcup ----
EXTENDS TLC
a \ll b == <<"\\ll", a, b>>
a \sqcup b == <<"\\sqcup", a, b>>
Test == PrintT(1 \ll 2 \sqcup 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\ll", 1, <<"\\sqcup", 2, 3>>>>'
---*)
