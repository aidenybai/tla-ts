(*---
description: Groups \star against \supset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_star_op__supset ----
EXTENDS TLC
a \star b == <<"\\star", a, b>>
a \supset b == <<"\\supset", a, b>>
Test == PrintT(1 \star 2 \supset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\supset", <<"\\star", 1, 2>>, 3>>'
---*)
