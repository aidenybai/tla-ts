(*---
description: concat of model_value, a ModelValue, and string_a, a StringValue.
ref: tlc2/module/Sequences.java#Concat
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
---- MODULE concat_model_value__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \o ("a"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module concat_model_value__string_a failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    mv
---*)
