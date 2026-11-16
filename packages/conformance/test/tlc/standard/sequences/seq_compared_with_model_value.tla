(*---
description: Seq is unequal to an untyped model value.
ref: tlc2/module/Sequences.java#compareTo
features:
  - Sequences
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE seq_compared_with_model_value ----
EXTENDS Sequences, Naturals
CONSTANT mv
Test == Seq({1}) # mv
====

(*--- recorded
all:
  exit: 0
---*)
