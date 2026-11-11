(*---
description: Groups \sqcap against \ll, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqcap__ll ----
EXTENDS TLC
a \sqcap b == <<"\\sqcap", a, b>>
a \ll b == <<"\\ll", a, b>>
Test == PrintT(1 \sqcap 2 \ll 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\ll", <<"\\sqcap", 1, 2>>, 3>>'
---*)
