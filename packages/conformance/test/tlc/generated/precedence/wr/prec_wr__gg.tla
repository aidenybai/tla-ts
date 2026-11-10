(*---
description: Groups \wr against \gg, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_wr__gg ----
EXTENDS TLC
a \wr b == <<"\\wr", a, b>>
a \gg b == <<"\\gg", a, b>>
Test == PrintT(1 \wr 2 \gg 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\gg", <<"\\wr", 1, 2>>, 3>>'
---*)
