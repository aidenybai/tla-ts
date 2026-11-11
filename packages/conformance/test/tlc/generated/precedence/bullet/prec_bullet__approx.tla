(*---
description: Groups \bullet against \approx, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bullet__approx ----
EXTENDS TLC
a \bullet b == <<"\\bullet", a, b>>
a \approx b == <<"\\approx", a, b>>
Test == PrintT(1 \bullet 2 \approx 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\approx", <<"\\bullet", 1, 2>>, 3>>'
---*)
