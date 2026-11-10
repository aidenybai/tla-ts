(*---
description: Groups \subset against (.), or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_subset_symbol__odot ----
EXTENDS TLC
a \subset b == <<"\\subset", a, b>>
a (.) b == <<"(.)", a, b>>
Test == PrintT(1 \subset 2 (.) 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\subset", 1, <<"(.)", 2, 3>>>>'
---*)
