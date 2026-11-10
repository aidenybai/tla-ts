(*---
description: Groups \sqcup against \approx, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcup__approx ----
EXTENDS TLC
a \sqcup b == <<"\\sqcup", a, b>>
a \approx b == <<"\\approx", a, b>>
Test == PrintT(1 \sqcup 2 \approx 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\approx", <<"\\sqcup", 1, 2>>, 3>>'
---*)
