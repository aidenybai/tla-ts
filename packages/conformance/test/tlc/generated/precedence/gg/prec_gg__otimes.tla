(*---
description: Groups \gg against (\X), or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_gg__otimes ----
EXTENDS TLC
a \gg b == <<"\\gg", a, b>>
a (\X) b == <<"(\\X)", a, b>>
Test == PrintT(1 \gg 2 (\X) 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\gg", 1, <<"(\\X)", 2, 3>>>>'
---*)
