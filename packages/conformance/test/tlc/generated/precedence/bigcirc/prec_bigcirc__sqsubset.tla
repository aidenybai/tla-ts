(*---
description: Groups \bigcirc against \sqsubset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bigcirc__sqsubset ----
EXTENDS TLC
a \bigcirc b == <<"\\bigcirc", a, b>>
a \sqsubset b == <<"\\sqsubset", a, b>>
Test == PrintT(1 \bigcirc 2 \sqsubset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsubset", <<"\\bigcirc", 1, 2>>, 3>>'
---*)
