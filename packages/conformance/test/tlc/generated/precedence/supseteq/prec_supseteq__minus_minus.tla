(*---
description: Groups \supseteq against --, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_supseteq__minus_minus ----
EXTENDS TLC
a \supseteq b == <<"\\supseteq", a, b>>
a -- b == <<"--", a, b>>
Test == PrintT(1 \supseteq 2 -- 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\supseteq", 1, <<"--", 2, 3>>>>'
---*)
