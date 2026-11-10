(*---
description: Groups \bigcirc against \sqsubseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bigcirc__sqsubseteq ----
EXTENDS TLC
a \bigcirc b == <<"\\bigcirc", a, b>>
a \sqsubseteq b == <<"\\sqsubseteq", a, b>>
Test == PrintT(1 \bigcirc 2 \sqsubseteq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsubseteq", <<"\\bigcirc", 1, 2>>, 3>>'
---*)
