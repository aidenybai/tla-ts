(*---
description: Groups \prec against \o, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_prec__o ----
EXTENDS TLC
a \prec b == <<"\\prec", a, b>>
a \o b == <<"\\o", a, b>>
Test == PrintT(1 \prec 2 \o 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\prec", 1, <<"\\o", 2, 3>>>>'
---*)
