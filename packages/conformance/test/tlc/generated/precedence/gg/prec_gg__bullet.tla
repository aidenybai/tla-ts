(*---
description: Groups \gg against \bullet, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_gg__bullet ----
EXTENDS TLC
a \gg b == <<"\\gg", a, b>>
a \bullet b == <<"\\bullet", a, b>>
Test == PrintT(1 \gg 2 \bullet 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\gg", 1, <<"\\bullet", 2, 3>>>>'
---*)
