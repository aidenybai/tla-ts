(*---
description: Groups \star against \sim, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_star_op__sim ----
EXTENDS TLC
a \star b == <<"\\star", a, b>>
a \sim b == <<"\\sim", a, b>>
Test == PrintT(1 \star 2 \sim 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\sim", <<"\\star", 1, 2>>, 3>>'
---*)
