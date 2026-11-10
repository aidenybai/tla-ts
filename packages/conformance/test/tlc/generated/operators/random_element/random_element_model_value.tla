(*---
description: random_element applied to model_value, a ModelValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE random_element_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(RandomElement(mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module random_element_model_value failed.
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    mv
---*)
