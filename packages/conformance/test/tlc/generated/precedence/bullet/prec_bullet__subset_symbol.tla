(*---
description: Groups \bullet against \subset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bullet__subset_symbol ----
EXTENDS TLC
a \bullet b == <<"\\bullet", a, b>>
a \subset b == <<"\\subset", a, b>>
Test == PrintT(1 \bullet 2 \subset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\subset", <<"\\bullet", 1, 2>>, 3>>'
---*)
