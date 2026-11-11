(*---
description: Groups \sqcap against \cong, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcap__cong ----
EXTENDS TLC
a \sqcap b == <<"\\sqcap", a, b>>
a \cong b == <<"\\cong", a, b>>
Test == PrintT(1 \sqcap 2 \cong 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\cong", <<"\\sqcap", 1, 2>>, 3>>'
---*)
