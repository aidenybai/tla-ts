(*---
description: Groups \div against \asymp, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_div__asymp ----
EXTENDS TLC
a \div b == <<"\\div", a, b>>
a \asymp b == <<"\\asymp", a, b>>
Test == PrintT(1 \div 2 \asymp 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\asymp", <<"\\div", 1, 2>>, 3>>'
---*)
