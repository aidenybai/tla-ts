(*---
description: Groups \bullet against \sim, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bullet__sim ----
EXTENDS TLC
a \bullet b == <<"\\bullet", a, b>>
a \sim b == <<"\\sim", a, b>>
Test == PrintT(1 \bullet 2 \sim 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sim", <<"\\bullet", 1, 2>>, 3>>'
---*)
