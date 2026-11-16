(*---
description: Groups \sqsupset against \star, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsupset__star_op ----
EXTENDS TLC
a \sqsupset b == <<"\\sqsupset", a, b>>
a \star b == <<"\\star", a, b>>
Test == PrintT(1 \sqsupset 2 \star 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsupset", 1, <<"\\star", 2, 3>>>>'
---*)
