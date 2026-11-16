(*---
description: Groups \approx against \sqcap, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_approx__sqcap ----
EXTENDS TLC
a \approx b == <<"\\approx", a, b>>
a \sqcap b == <<"\\sqcap", a, b>>
Test == PrintT(1 \approx 2 \sqcap 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\approx", 1, <<"\\sqcap", 2, 3>>>>'
---*)
