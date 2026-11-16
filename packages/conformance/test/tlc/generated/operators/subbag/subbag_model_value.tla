(*---
description: subbag applied to model_value, a ModelValue.
ref: tlc2/module/Bags.java#SubBag
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
---- MODULE subbag_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(SubBag(mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module subbag_model_value failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a model value)
    line 106, col 58 to line 106, col 65 of module Bags
---*)
