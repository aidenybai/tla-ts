(*---
description: Groups \div against \subset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_div__subset_symbol ----
EXTENDS TLC
a \div b == <<"\\div", a, b>>
a \subset b == <<"\\subset", a, b>>
Test == PrintT(1 \div 2 \subset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\subset", <<"\\div", 1, 2>>, 3>>'
---*)
