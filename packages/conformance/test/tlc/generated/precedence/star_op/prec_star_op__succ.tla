(*---
description: Groups \star against \succ, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_star_op__succ ----
EXTENDS TLC
a \star b == <<"\\star", a, b>>
a \succ b == <<"\\succ", a, b>>
Test == PrintT(1 \star 2 \succ 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\succ", <<"\\star", 1, 2>>, 3>>'
---*)
