(*---
description: Groups \bigcirc against \asymp, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bigcirc__asymp ----
EXTENDS TLC
a \bigcirc b == <<"\\bigcirc", a, b>>
a \asymp b == <<"\\asymp", a, b>>
Test == PrintT(1 \bigcirc 2 \asymp 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\asymp", <<"\\bigcirc", 1, 2>>, 3>>'
---*)
