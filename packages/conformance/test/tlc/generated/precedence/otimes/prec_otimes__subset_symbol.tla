(*---
description: Groups (\X) against \subset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_otimes__subset_symbol ----
EXTENDS TLC
a (\X) b == <<"(\\X)", a, b>>
a \subset b == <<"\\subset", a, b>>
Test == PrintT(1 (\X) 2 \subset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\subset", <<"(\\X)", 1, 2>>, 3>>'
---*)
