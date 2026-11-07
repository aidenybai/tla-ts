(*---
description: Groups \approx against \wr, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_approx__wr ----
EXTENDS TLC
a \approx b == <<"\\approx", a, b>>
a \wr b == <<"\\wr", a, b>>
Test == PrintT(1 \approx 2 \wr 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\approx", 1, <<"\\wr", 2, 3>>>>'
---*)
