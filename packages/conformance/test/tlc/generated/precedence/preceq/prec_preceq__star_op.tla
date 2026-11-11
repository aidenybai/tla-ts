(*---
description: Groups \preceq against \star, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_preceq__star_op ----
EXTENDS TLC
a \preceq b == <<"\\preceq", a, b>>
a \star b == <<"\\star", a, b>>
Test == PrintT(1 \preceq 2 \star 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\preceq", 1, <<"\\star", 2, 3>>>>'
---*)
