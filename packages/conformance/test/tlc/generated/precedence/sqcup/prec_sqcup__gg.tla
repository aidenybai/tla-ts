(*---
description: Groups \sqcup against \gg, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcup__gg ----
EXTENDS TLC
a \sqcup b == <<"\\sqcup", a, b>>
a \gg b == <<"\\gg", a, b>>
Test == PrintT(1 \sqcup 2 \gg 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\gg", <<"\\sqcup", 1, 2>>, 3>>'
---*)
