(*---
description: Groups \ll against \bullet, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_ll__bullet ----
EXTENDS TLC
a \ll b == <<"\\ll", a, b>>
a \bullet b == <<"\\bullet", a, b>>
Test == PrintT(1 \ll 2 \bullet 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\ll", 1, <<"\\bullet", 2, 3>>>>'
---*)
