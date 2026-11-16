(*---
description: Groups \wr against \cong, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_wr__cong ----
EXTENDS TLC
a \wr b == <<"\\wr", a, b>>
a \cong b == <<"\\cong", a, b>>
Test == PrintT(1 \wr 2 \cong 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\cong", <<"\\wr", 1, 2>>, 3>>'
---*)
