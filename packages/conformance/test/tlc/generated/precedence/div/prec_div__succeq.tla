(*---
description: Groups \div against \succeq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_div__succeq ----
EXTENDS TLC
a \div b == <<"\\div", a, b>>
a \succeq b == <<"\\succeq", a, b>>
Test == PrintT(1 \div 2 \succeq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\succeq", <<"\\div", 1, 2>>, 3>>'
---*)
