(*---
description: Groups \bullet against \prec, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bullet__prec ----
EXTENDS TLC
a \bullet b == <<"\\bullet", a, b>>
a \prec b == <<"\\prec", a, b>>
Test == PrintT(1 \bullet 2 \prec 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\prec", <<"\\bullet", 1, 2>>, 3>>'
---*)
