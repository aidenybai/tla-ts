(*---
description: Groups \bigcirc against \ll, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bigcirc__ll ----
EXTENDS TLC
a \bigcirc b == <<"\\bigcirc", a, b>>
a \ll b == <<"\\ll", a, b>>
Test == PrintT(1 \bigcirc 2 \ll 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\ll", <<"\\bigcirc", 1, 2>>, 3>>'
---*)
