(*---
description: Groups \wr against ::=, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_wr__colon_colon_equals ----
EXTENDS TLC
a \wr b == <<"\\wr", a, b>>
a ::= b == <<"::=", a, b>>
Test == PrintT(1 \wr 2 ::= 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"::=", <<"\\wr", 1, 2>>, 3>>'
---*)
