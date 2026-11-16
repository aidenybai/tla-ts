(*---
description: Groups \asymp against \star, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_asymp__star_op ----
EXTENDS TLC
a \asymp b == <<"\\asymp", a, b>>
a \star b == <<"\\star", a, b>>
Test == PrintT(1 \asymp 2 \star 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\asymp", 1, <<"\\star", 2, 3>>>>'
---*)
