(*---
description: Groups \star against \prec, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_star_op__prec ----
EXTENDS TLC
a \star b == <<"\\star", a, b>>
a \prec b == <<"\\prec", a, b>>
Test == PrintT(1 \star 2 \prec 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\prec", <<"\\star", 1, 2>>, 3>>'
---*)
