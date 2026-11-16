(*---
description: Groups \uplus against \gg, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_uplus__gg ----
EXTENDS TLC
a \uplus b == <<"\\uplus", a, b>>
a \gg b == <<"\\gg", a, b>>
Test == PrintT(1 \uplus 2 \gg 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\gg", <<"\\uplus", 1, 2>>, 3>>'
---*)
