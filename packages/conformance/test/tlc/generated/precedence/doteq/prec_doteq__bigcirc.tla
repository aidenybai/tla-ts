(*---
description: Groups \doteq against \bigcirc, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_doteq__bigcirc ----
EXTENDS TLC
a \doteq b == <<"\\doteq", a, b>>
a \bigcirc b == <<"\\bigcirc", a, b>>
Test == PrintT(1 \doteq 2 \bigcirc 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\doteq", 1, <<"\\bigcirc", 2, 3>>>>'
---*)
