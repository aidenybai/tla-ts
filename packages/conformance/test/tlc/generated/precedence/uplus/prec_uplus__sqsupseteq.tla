(*---
description: Groups \uplus against \sqsupseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_uplus__sqsupseteq ----
EXTENDS TLC
a \uplus b == <<"\\uplus", a, b>>
a \sqsupseteq b == <<"\\sqsupseteq", a, b>>
Test == PrintT(1 \uplus 2 \sqsupseteq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsupseteq", <<"\\uplus", 1, 2>>, 3>>'
---*)
