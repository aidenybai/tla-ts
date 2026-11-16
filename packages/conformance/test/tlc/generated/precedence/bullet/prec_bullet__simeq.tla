(*---
description: Groups \bullet against \simeq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_bullet__simeq ----
EXTENDS TLC
a \bullet b == <<"\\bullet", a, b>>
a \simeq b == <<"\\simeq", a, b>>
Test == PrintT(1 \bullet 2 \simeq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\simeq", <<"\\bullet", 1, 2>>, 3>>'
---*)
