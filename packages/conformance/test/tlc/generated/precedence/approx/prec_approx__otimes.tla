(*---
description: Groups \approx against (\X), or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_approx__otimes ----
EXTENDS TLC
a \approx b == <<"\\approx", a, b>>
a (\X) b == <<"(\\X)", a, b>>
Test == PrintT(1 \approx 2 (\X) 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\approx", 1, <<"(\\X)", 2, 3>>>>'
---*)
