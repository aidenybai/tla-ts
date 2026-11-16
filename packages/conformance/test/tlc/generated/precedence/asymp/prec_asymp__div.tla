(*---
description: Groups \asymp against \div, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_asymp__div ----
EXTENDS TLC
a \asymp b == <<"\\asymp", a, b>>
a \div b == <<"\\div", a, b>>
Test == PrintT(1 \asymp 2 \div 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\asymp", 1, <<"\\div", 2, 3>>>>'
---*)
