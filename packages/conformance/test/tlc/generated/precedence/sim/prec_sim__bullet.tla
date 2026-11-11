(*---
description: Groups \sim against \bullet, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sim__bullet ----
EXTENDS TLC
a \sim b == <<"\\sim", a, b>>
a \bullet b == <<"\\bullet", a, b>>
Test == PrintT(1 \sim 2 \bullet 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sim", 1, <<"\\bullet", 2, 3>>>>'
---*)
