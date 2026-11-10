(*---
description: Groups \div against \propto, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_div__propto ----
EXTENDS TLC
a \div b == <<"\\div", a, b>>
a \propto b == <<"\\propto", a, b>>
Test == PrintT(1 \div 2 \propto 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\propto", <<"\\div", 1, 2>>, 3>>'
---*)
