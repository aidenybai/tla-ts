(*---
description: Groups ^^ against \succ, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_caret_caret__succ ----
EXTENDS TLC
a ^^ b == <<"^^", a, b>>
a \succ b == <<"\\succ", a, b>>
Test == PrintT(1 ^^ 2 \succ 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\succ", <<"^^", 1, 2>>, 3>>'
---*)
