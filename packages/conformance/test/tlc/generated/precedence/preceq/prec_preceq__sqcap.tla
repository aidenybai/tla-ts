(*---
description: Groups \preceq against \sqcap, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_preceq__sqcap ----
EXTENDS TLC
a \preceq b == <<"\\preceq", a, b>>
a \sqcap b == <<"\\sqcap", a, b>>
Test == PrintT(1 \preceq 2 \sqcap 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\preceq", 1, <<"\\sqcap", 2, 3>>>>'
---*)
