(*---
description: Groups \sqcup against \doteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcup__doteq ----
EXTENDS TLC
a \sqcup b == <<"\\sqcup", a, b>>
a \doteq b == <<"\\doteq", a, b>>
Test == PrintT(1 \sqcup 2 \doteq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\doteq", <<"\\sqcup", 1, 2>>, 3>>'
---*)
