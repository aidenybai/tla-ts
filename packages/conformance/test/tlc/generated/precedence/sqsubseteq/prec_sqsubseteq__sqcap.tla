(*---
description: Groups \sqsubseteq against \sqcap, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsubseteq__sqcap ----
EXTENDS TLC
a \sqsubseteq b == <<"\\sqsubseteq", a, b>>
a \sqcap b == <<"\\sqcap", a, b>>
Test == PrintT(1 \sqsubseteq 2 \sqcap 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsubseteq", 1, <<"\\sqcap", 2, 3>>>>'
---*)
