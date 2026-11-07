(*---
description: Groups \bigcirc against \prec, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bigcirc__prec ----
EXTENDS TLC
a \bigcirc b == <<"\\bigcirc", a, b>>
a \prec b == <<"\\prec", a, b>>
Test == PrintT(1 \bigcirc 2 \prec 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\prec", <<"\\bigcirc", 1, 2>>, 3>>'
---*)
