(*---
description: Groups \asymp against (\X), or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_asymp__otimes ----
EXTENDS TLC
a \asymp b == <<"\\asymp", a, b>>
a (\X) b == <<"(\\X)", a, b>>
Test == PrintT(1 \asymp 2 (\X) 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\asymp", 1, <<"(\\X)", 2, 3>>>>'
---*)
