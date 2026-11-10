(*---
description: Groups \sqsupseteq against \sqcap, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsupseteq__sqcap ----
EXTENDS TLC
a \sqsupseteq b == <<"\\sqsupseteq", a, b>>
a \sqcap b == <<"\\sqcap", a, b>>
Test == PrintT(1 \sqsupseteq 2 \sqcap 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsupseteq", 1, <<"\\sqcap", 2, 3>>>>'
---*)
