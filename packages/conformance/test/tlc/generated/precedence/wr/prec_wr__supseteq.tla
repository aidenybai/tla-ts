(*---
description: Groups \wr against \supseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_wr__supseteq ----
EXTENDS TLC
a \wr b == <<"\\wr", a, b>>
a \supseteq b == <<"\\supseteq", a, b>>
Test == PrintT(1 \wr 2 \supseteq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\supseteq", <<"\\wr", 1, 2>>, 3>>'
---*)
