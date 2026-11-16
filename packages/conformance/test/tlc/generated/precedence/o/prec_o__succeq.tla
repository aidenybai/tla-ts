(*---
description: Groups \o against \succeq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_o__succeq ----
EXTENDS TLC
a \o b == <<"\\o", a, b>>
a \succeq b == <<"\\succeq", a, b>>
Test == PrintT(1 \o 2 \succeq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\succeq", <<"\\o", 1, 2>>, 3>>'
---*)
