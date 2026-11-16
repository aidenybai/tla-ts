(*---
description: Groups \sim against \wr, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sim__wr ----
EXTENDS TLC
a \sim b == <<"\\sim", a, b>>
a \wr b == <<"\\wr", a, b>>
Test == PrintT(1 \sim 2 \wr 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sim", 1, <<"\\wr", 2, 3>>>>'
---*)
