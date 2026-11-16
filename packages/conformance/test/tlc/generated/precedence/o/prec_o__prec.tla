(*---
description: Groups \o against \prec, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_o__prec ----
EXTENDS TLC
a \o b == <<"\\o", a, b>>
a \prec b == <<"\\prec", a, b>>
Test == PrintT(1 \o 2 \prec 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\prec", <<"\\o", 1, 2>>, 3>>'
---*)
