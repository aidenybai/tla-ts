(*---
description: Groups \star against \subset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_star_op__subset_symbol ----
EXTENDS TLC
a \star b == <<"\\star", a, b>>
a \subset b == <<"\\subset", a, b>>
Test == PrintT(1 \star 2 \subset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\subset", <<"\\star", 1, 2>>, 3>>'
---*)
