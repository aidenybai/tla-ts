(*---
description: Groups \ll against (\X), or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_ll__otimes ----
EXTENDS TLC
a \ll b == <<"\\ll", a, b>>
a (\X) b == <<"(\\X)", a, b>>
Test == PrintT(1 \ll 2 (\X) 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\ll", 1, <<"(\\X)", 2, 3>>>>'
---*)
