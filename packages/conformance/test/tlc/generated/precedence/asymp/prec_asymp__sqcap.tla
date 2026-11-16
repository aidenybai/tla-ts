(*---
description: Groups \asymp against \sqcap, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_asymp__sqcap ----
EXTENDS TLC
a \asymp b == <<"\\asymp", a, b>>
a \sqcap b == <<"\\sqcap", a, b>>
Test == PrintT(1 \asymp 2 \sqcap 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\asymp", 1, <<"\\sqcap", 2, 3>>>>'
---*)
