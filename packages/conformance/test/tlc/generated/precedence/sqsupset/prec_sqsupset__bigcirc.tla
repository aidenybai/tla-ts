(*---
description: Groups \sqsupset against \bigcirc, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsupset__bigcirc ----
EXTENDS TLC
a \sqsupset b == <<"\\sqsupset", a, b>>
a \bigcirc b == <<"\\bigcirc", a, b>>
Test == PrintT(1 \sqsupset 2 \bigcirc 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsupset", 1, <<"\\bigcirc", 2, 3>>>>'
---*)
