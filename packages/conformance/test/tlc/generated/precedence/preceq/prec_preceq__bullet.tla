(*---
description: Groups \preceq against \bullet, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_preceq__bullet ----
EXTENDS TLC
a \preceq b == <<"\\preceq", a, b>>
a \bullet b == <<"\\bullet", a, b>>
Test == PrintT(1 \preceq 2 \bullet 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\preceq", 1, <<"\\bullet", 2, 3>>>>'
---*)
