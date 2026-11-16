(*---
description: Groups \sqcap against \propto, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcap__propto ----
EXTENDS TLC
a \sqcap b == <<"\\sqcap", a, b>>
a \propto b == <<"\\propto", a, b>>
Test == PrintT(1 \sqcap 2 \propto 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\propto", <<"\\sqcap", 1, 2>>, 3>>'
---*)
