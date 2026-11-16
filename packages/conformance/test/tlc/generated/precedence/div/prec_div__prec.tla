(*---
description: Groups \div against \prec, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_div__prec ----
EXTENDS TLC
a \div b == <<"\\div", a, b>>
a \prec b == <<"\\prec", a, b>>
Test == PrintT(1 \div 2 \prec 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\prec", <<"\\div", 1, 2>>, 3>>'
---*)
