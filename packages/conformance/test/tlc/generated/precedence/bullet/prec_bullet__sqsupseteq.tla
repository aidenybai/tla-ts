(*---
description: Groups \bullet against \sqsupseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bullet__sqsupseteq ----
EXTENDS TLC
a \bullet b == <<"\\bullet", a, b>>
a \sqsupseteq b == <<"\\sqsupseteq", a, b>>
Test == PrintT(1 \bullet 2 \sqsupseteq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsupseteq", <<"\\bullet", 1, 2>>, 3>>'
---*)
