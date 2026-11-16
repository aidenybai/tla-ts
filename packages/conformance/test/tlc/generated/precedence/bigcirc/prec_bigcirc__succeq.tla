(*---
description: Groups \bigcirc against \succeq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bigcirc__succeq ----
EXTENDS TLC
a \bigcirc b == <<"\\bigcirc", a, b>>
a \succeq b == <<"\\succeq", a, b>>
Test == PrintT(1 \bigcirc 2 \succeq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\succeq", <<"\\bigcirc", 1, 2>>, 3>>'
---*)
