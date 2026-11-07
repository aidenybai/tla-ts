(*---
description: Groups \gg against *, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_gg__star ----
EXTENDS TLC
a \gg b == <<"\\gg", a, b>>
a * b == <<"*", a, b>>
Test == PrintT(1 \gg 2 * 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\gg", 1, <<"*", 2, 3>>>>'
---*)
