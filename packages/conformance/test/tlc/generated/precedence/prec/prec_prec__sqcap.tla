(*---
description: Groups \prec against \sqcap, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_prec__sqcap ----
EXTENDS TLC
a \prec b == <<"\\prec", a, b>>
a \sqcap b == <<"\\sqcap", a, b>>
Test == PrintT(1 \prec 2 \sqcap 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\prec", 1, <<"\\sqcap", 2, 3>>>>'
---*)
