(*---
description: Groups \simeq against \bullet, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_simeq__bullet ----
EXTENDS TLC
a \simeq b == <<"\\simeq", a, b>>
a \bullet b == <<"\\bullet", a, b>>
Test == PrintT(1 \simeq 2 \bullet 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\simeq", 1, <<"\\bullet", 2, 3>>>>'
---*)
