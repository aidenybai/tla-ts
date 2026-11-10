(*---
description: Groups \star against \sqsupset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_star_op__sqsupset ----
EXTENDS TLC
a \star b == <<"\\star", a, b>>
a \sqsupset b == <<"\\sqsupset", a, b>>
Test == PrintT(1 \star 2 \sqsupset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsupset", <<"\\star", 1, 2>>, 3>>'
---*)
