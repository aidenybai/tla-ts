(*---
description: Groups \star against \sqsubseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_star_op__sqsubseteq ----
EXTENDS TLC
a \star b == <<"\\star", a, b>>
a \sqsubseteq b == <<"\\sqsubseteq", a, b>>
Test == PrintT(1 \star 2 \sqsubseteq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsubseteq", <<"\\star", 1, 2>>, 3>>'
---*)
