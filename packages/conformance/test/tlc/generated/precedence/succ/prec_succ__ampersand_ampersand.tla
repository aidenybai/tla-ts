(*---
description: Groups \succ against &&, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_succ__ampersand_ampersand ----
EXTENDS TLC
a \succ b == <<"\\succ", a, b>>
a && b == <<"&&", a, b>>
Test == PrintT(1 \succ 2 && 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\succ", 1, <<"&&", 2, 3>>>>'
---*)
