(*---
description: Groups \sqcup against \propto, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcup__propto ----
EXTENDS TLC
a \sqcup b == <<"\\sqcup", a, b>>
a \propto b == <<"\\propto", a, b>>
Test == PrintT(1 \sqcup 2 \propto 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\propto", <<"\\sqcup", 1, 2>>, 3>>'
---*)
