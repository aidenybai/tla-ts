(*---
description: Groups \bigcirc against \subset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bigcirc__subset_symbol ----
EXTENDS TLC
a \bigcirc b == <<"\\bigcirc", a, b>>
a \subset b == <<"\\subset", a, b>>
Test == PrintT(1 \bigcirc 2 \subset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\subset", <<"\\bigcirc", 1, 2>>, 3>>'
---*)
