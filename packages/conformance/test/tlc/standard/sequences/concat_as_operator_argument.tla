(*---
description: \o can be passed as an operator argument.
ref: tlc2/module/Sequences.java#Concat
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE concat_as_operator_argument ----
EXTENDS Sequences, Naturals
Apply(Op(_, _), a, b) == Op(a, b)
Test == Apply(\o, <<1>>, <<2>>) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
