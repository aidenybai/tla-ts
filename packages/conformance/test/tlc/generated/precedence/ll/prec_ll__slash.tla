(*---
description: Groups \ll against /, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_ll__slash ----
EXTENDS TLC
a \ll b == <<"\\ll", a, b>>
a / b == <<"/", a, b>>
Test == PrintT(1 \ll 2 / 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\ll", 1, <<"/", 2, 3>>>>'
---*)
