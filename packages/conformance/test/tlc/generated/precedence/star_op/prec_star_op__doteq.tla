(*---
description: Groups \star against \doteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_star_op__doteq ----
EXTENDS TLC
a \star b == <<"\\star", a, b>>
a \doteq b == <<"\\doteq", a, b>>
Test == PrintT(1 \star 2 \doteq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\doteq", <<"\\star", 1, 2>>, 3>>'
---*)
