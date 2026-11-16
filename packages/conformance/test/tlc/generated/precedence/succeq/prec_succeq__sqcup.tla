(*---
description: Groups \succeq against \sqcup, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_succeq__sqcup ----
EXTENDS TLC
a \succeq b == <<"\\succeq", a, b>>
a \sqcup b == <<"\\sqcup", a, b>>
Test == PrintT(1 \succeq 2 \sqcup 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\succeq", 1, <<"\\sqcup", 2, 3>>>>'
---*)
