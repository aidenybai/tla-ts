(*---
description: Groups \uplus against ^, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_uplus__caret ----
EXTENDS TLC
a \uplus b == <<"\\uplus", a, b>>
a ^ b == <<"^", a, b>>
Test == PrintT(1 \uplus 2 ^ 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\uplus", 1, <<"^", 2, 3>>>>'
---*)
