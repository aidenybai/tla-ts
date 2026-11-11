(*---
description: Groups \subset against \o, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_subset_symbol__o ----
EXTENDS TLC
a \subset b == <<"\\subset", a, b>>
a \o b == <<"\\o", a, b>>
Test == PrintT(1 \subset 2 \o 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\subset", 1, <<"\\o", 2, 3>>>>'
---*)
