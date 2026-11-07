(*---
description: Groups \div against \ll, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_div__ll ----
EXTENDS TLC
a \div b == <<"\\div", a, b>>
a \ll b == <<"\\ll", a, b>>
Test == PrintT(1 \div 2 \ll 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\ll", <<"\\div", 1, 2>>, 3>>'
---*)
