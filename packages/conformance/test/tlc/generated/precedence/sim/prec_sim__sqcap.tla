(*---
description: Groups \sim against \sqcap, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sim__sqcap ----
EXTENDS TLC
a \sim b == <<"\\sim", a, b>>
a \sqcap b == <<"\\sqcap", a, b>>
Test == PrintT(1 \sim 2 \sqcap 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sim", 1, <<"\\sqcap", 2, 3>>>>'
---*)
