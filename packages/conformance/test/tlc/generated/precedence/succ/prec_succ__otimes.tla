(*---
description: Groups \succ against (\X), or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_succ__otimes ----
EXTENDS TLC
a \succ b == <<"\\succ", a, b>>
a (\X) b == <<"(\\X)", a, b>>
Test == PrintT(1 \succ 2 (\X) 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\succ", 1, <<"(\\X)", 2, 3>>>>'
---*)
