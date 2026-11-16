(*---
description: Groups (+) against \doteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_oplus__doteq ----
EXTENDS TLC
a (+) b == <<"(+)", a, b>>
a \doteq b == <<"\\doteq", a, b>>
Test == PrintT(1 (+) 2 \doteq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\doteq", <<"(+)", 1, 2>>, 3>>'
---*)
