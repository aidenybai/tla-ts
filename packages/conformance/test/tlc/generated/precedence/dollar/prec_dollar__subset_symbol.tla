(*---
description: Groups $ against \subset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_dollar__subset_symbol ----
EXTENDS TLC
a $ b == <<"$", a, b>>
a \subset b == <<"\\subset", a, b>>
Test == PrintT(1 $ 2 \subset 3)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"\\subset", <<"$", 1, 2>>, 3>>'
---*)
