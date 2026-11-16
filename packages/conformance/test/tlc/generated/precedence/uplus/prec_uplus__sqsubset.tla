(*---
description: Groups \uplus against \sqsubset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_uplus__sqsubset ----
EXTENDS TLC
a \uplus b == <<"\\uplus", a, b>>
a \sqsubset b == <<"\\sqsubset", a, b>>
Test == PrintT(1 \uplus 2 \sqsubset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsubset", <<"\\uplus", 1, 2>>, 3>>'
---*)
