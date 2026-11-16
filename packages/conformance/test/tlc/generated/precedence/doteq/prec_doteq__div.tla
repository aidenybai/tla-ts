(*---
description: Groups \doteq against \div, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_doteq__div ----
EXTENDS TLC
a \doteq b == <<"\\doteq", a, b>>
a \div b == <<"\\div", a, b>>
Test == PrintT(1 \doteq 2 \div 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\doteq", 1, <<"\\div", 2, 3>>>>'
---*)
