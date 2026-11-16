(*---
description: Groups ?? against \approx, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_question__approx ----
EXTENDS TLC
a ?? b == <<"??", a, b>>
a \approx b == <<"\\approx", a, b>>
Test == PrintT(1 ?? 2 \approx 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\approx", <<"??", 1, 2>>, 3>>'
---*)
