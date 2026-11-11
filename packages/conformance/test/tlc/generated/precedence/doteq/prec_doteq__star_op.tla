(*---
description: Groups \doteq against \star, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_doteq__star_op ----
EXTENDS TLC
a \doteq b == <<"\\doteq", a, b>>
a \star b == <<"\\star", a, b>>
Test == PrintT(1 \doteq 2 \star 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\doteq", 1, <<"\\star", 2, 3>>>>'
---*)
