(*---
description: Groups \ll against \div, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_ll__div ----
EXTENDS TLC
a \ll b == <<"\\ll", a, b>>
a \div b == <<"\\div", a, b>>
Test == PrintT(1 \ll 2 \div 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\ll", 1, <<"\\div", 2, 3>>>>'
---*)
