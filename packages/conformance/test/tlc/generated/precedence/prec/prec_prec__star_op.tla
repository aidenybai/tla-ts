(*---
description: Groups \prec against \star, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_prec__star_op ----
EXTENDS TLC
a \prec b == <<"\\prec", a, b>>
a \star b == <<"\\star", a, b>>
Test == PrintT(1 \prec 2 \star 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\prec", 1, <<"\\star", 2, 3>>>>'
---*)
