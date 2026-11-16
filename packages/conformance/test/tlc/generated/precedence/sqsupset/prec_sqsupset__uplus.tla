(*---
description: Groups \sqsupset against \uplus, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsupset__uplus ----
EXTENDS TLC
a \sqsupset b == <<"\\sqsupset", a, b>>
a \uplus b == <<"\\uplus", a, b>>
Test == PrintT(1 \sqsupset 2 \uplus 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsupset", 1, <<"\\uplus", 2, 3>>>>'
---*)
