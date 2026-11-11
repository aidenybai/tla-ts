(*---
description: Groups \ll against \sqcap, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_ll__sqcap ----
EXTENDS TLC
a \ll b == <<"\\ll", a, b>>
a \sqcap b == <<"\\sqcap", a, b>>
Test == PrintT(1 \ll 2 \sqcap 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\ll", 1, <<"\\sqcap", 2, 3>>>>'
---*)
