(*---
description: Groups \div against \sqsupset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_div__sqsupset ----
EXTENDS TLC
a \div b == <<"\\div", a, b>>
a \sqsupset b == <<"\\sqsupset", a, b>>
Test == PrintT(1 \div 2 \sqsupset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsupset", <<"\\div", 1, 2>>, 3>>'
---*)
