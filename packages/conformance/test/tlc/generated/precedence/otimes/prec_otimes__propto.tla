(*---
description: Groups (\X) against \propto, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_otimes__propto ----
EXTENDS TLC
a (\X) b == <<"(\\X)", a, b>>
a \propto b == <<"\\propto", a, b>>
Test == PrintT(1 (\X) 2 \propto 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\propto", <<"(\\X)", 1, 2>>, 3>>'
---*)
