(*---
description: Groups \sqcup against \preceq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcup__preceq ----
EXTENDS TLC
a \sqcup b == <<"\\sqcup", a, b>>
a \preceq b == <<"\\preceq", a, b>>
Test == PrintT(1 \sqcup 2 \preceq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\preceq", <<"\\sqcup", 1, 2>>, 3>>'
---*)
