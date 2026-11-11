(*---
description: An untyped model value is not in Seq(S).
ref: tlc2/module/Sequences.java#member
features:
  - Sequences
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE seq_model_value_member ----
EXTENDS Sequences, Naturals
CONSTANT mv
Test == mv \notin Seq({1})
====

(*--- recorded
all:
  exit: 0
---*)
