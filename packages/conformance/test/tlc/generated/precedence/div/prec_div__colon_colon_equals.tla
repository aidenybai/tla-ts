(*---
description: Groups \div against ::=, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_div__colon_colon_equals ----
EXTENDS TLC
a \div b == <<"\\div", a, b>>
a ::= b == <<"::=", a, b>>
Test == PrintT(1 \div 2 ::= 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"::=", <<"\\div", 1, 2>>, 3>>'
---*)
