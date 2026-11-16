(*---
description: Groups \sqcap against \succeq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcap__succeq ----
EXTENDS TLC
a \sqcap b == <<"\\sqcap", a, b>>
a \succeq b == <<"\\succeq", a, b>>
Test == PrintT(1 \sqcap 2 \succeq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\succeq", <<"\\sqcap", 1, 2>>, 3>>'
---*)
