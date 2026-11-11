(*---
description: Groups \bigcirc against \approx, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bigcirc__approx ----
EXTENDS TLC
a \bigcirc b == <<"\\bigcirc", a, b>>
a \approx b == <<"\\approx", a, b>>
Test == PrintT(1 \bigcirc 2 \approx 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\approx", <<"\\bigcirc", 1, 2>>, 3>>'
---*)
