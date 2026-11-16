(*---
description: Groups \o against \gg, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_o__gg ----
EXTENDS TLC
a \o b == <<"\\o", a, b>>
a \gg b == <<"\\gg", a, b>>
Test == PrintT(1 \o 2 \gg 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\gg", <<"\\o", 1, 2>>, 3>>'
---*)
