(*---
description: Groups \sqsupseteq against \uplus, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsupseteq__uplus ----
EXTENDS TLC
a \sqsupseteq b == <<"\\sqsupseteq", a, b>>
a \uplus b == <<"\\uplus", a, b>>
Test == PrintT(1 \sqsupseteq 2 \uplus 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sqsupseteq", 1, <<"\\uplus", 2, 3>>>>'
---*)
