(*---
description: Groups \wr against \asymp, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_wr__asymp ----
EXTENDS TLC
a \wr b == <<"\\wr", a, b>>
a \asymp b == <<"\\asymp", a, b>>
Test == PrintT(1 \wr 2 \asymp 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\asymp", <<"\\wr", 1, 2>>, 3>>'
---*)
