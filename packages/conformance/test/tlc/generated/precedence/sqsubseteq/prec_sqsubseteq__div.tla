(*---
description: Groups \sqsubseteq against \div, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsubseteq__div ----
EXTENDS TLC
a \sqsubseteq b == <<"\\sqsubseteq", a, b>>
a \div b == <<"\\div", a, b>>
Test == PrintT(1 \sqsubseteq 2 \div 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsubseteq", 1, <<"\\div", 2, 3>>>>'
---*)
