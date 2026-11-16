(*---
description: Groups \wr against \subset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_wr__subset_symbol ----
EXTENDS TLC
a \wr b == <<"\\wr", a, b>>
a \subset b == <<"\\subset", a, b>>
Test == PrintT(1 \wr 2 \subset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\subset", <<"\\wr", 1, 2>>, 3>>'
---*)
