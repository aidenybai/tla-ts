(*---
description: Groups \sqcap against \doteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcap__doteq ----
EXTENDS TLC
a \sqcap b == <<"\\sqcap", a, b>>
a \doteq b == <<"\\doteq", a, b>>
Test == PrintT(1 \sqcap 2 \doteq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\doteq", <<"\\sqcap", 1, 2>>, 3>>'
---*)
