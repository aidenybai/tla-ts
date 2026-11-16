(*---
description: Groups \supset against ^, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_supset__caret ----
EXTENDS TLC
a \supset b == <<"\\supset", a, b>>
a ^ b == <<"^", a, b>>
Test == PrintT(1 \supset 2 ^ 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\supset", 1, <<"^", 2, 3>>>>'
---*)
