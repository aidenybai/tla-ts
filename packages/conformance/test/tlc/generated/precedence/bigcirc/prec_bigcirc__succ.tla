(*---
description: Groups \bigcirc against \succ, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bigcirc__succ ----
EXTENDS TLC
a \bigcirc b == <<"\\bigcirc", a, b>>
a \succ b == <<"\\succ", a, b>>
Test == PrintT(1 \bigcirc 2 \succ 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\succ", <<"\\bigcirc", 1, 2>>, 3>>'
---*)
