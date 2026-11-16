(*---
description: Groups \succ against \o, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_succ__o ----
EXTENDS TLC
a \succ b == <<"\\succ", a, b>>
a \o b == <<"\\o", a, b>>
Test == PrintT(1 \succ 2 \o 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\succ", 1, <<"\\o", 2, 3>>>>'
---*)
