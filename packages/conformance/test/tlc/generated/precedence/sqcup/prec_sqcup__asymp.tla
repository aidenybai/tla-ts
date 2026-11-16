(*---
description: Groups \sqcup against \asymp, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcup__asymp ----
EXTENDS TLC
a \sqcup b == <<"\\sqcup", a, b>>
a \asymp b == <<"\\asymp", a, b>>
Test == PrintT(1 \sqcup 2 \asymp 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\asymp", <<"\\sqcup", 1, 2>>, 3>>'
---*)
