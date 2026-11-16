(*---
description: Groups \simeq against \sqcup, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_simeq__sqcup ----
EXTENDS TLC
a \simeq b == <<"\\simeq", a, b>>
a \sqcup b == <<"\\sqcup", a, b>>
Test == PrintT(1 \simeq 2 \sqcup 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\simeq", 1, <<"\\sqcup", 2, 3>>>>'
---*)
