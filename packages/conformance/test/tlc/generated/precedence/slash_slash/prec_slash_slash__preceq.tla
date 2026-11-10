(*---
description: Groups // against \preceq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_slash_slash__preceq ----
EXTENDS TLC
a // b == <<"//", a, b>>
a \preceq b == <<"\\preceq", a, b>>
Test == PrintT(1 // 2 \preceq 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\preceq", <<"//", 1, 2>>, 3>>'
---*)
