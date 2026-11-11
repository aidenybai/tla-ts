(*---
description: Groups \sqcup against \supseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcup__supseteq ----
EXTENDS TLC
a \sqcup b == <<"\\sqcup", a, b>>
a \supseteq b == <<"\\supseteq", a, b>>
Test == PrintT(1 \sqcup 2 \supseteq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\supseteq", <<"\\sqcup", 1, 2>>, 3>>'
---*)
