(*---
description: Groups \star against \ll, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_star_op__ll ----
EXTENDS TLC
a \star b == <<"\\star", a, b>>
a \ll b == <<"\\ll", a, b>>
Test == PrintT(1 \star 2 \ll 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\ll", <<"\\star", 1, 2>>, 3>>'
---*)
