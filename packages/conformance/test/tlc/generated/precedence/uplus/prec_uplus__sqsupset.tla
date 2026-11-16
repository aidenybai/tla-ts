(*---
description: Groups \uplus against \sqsupset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_uplus__sqsupset ----
EXTENDS TLC
a \uplus b == <<"\\uplus", a, b>>
a \sqsupset b == <<"\\sqsupset", a, b>>
Test == PrintT(1 \uplus 2 \sqsupset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsupset", <<"\\uplus", 1, 2>>, 3>>'
---*)
