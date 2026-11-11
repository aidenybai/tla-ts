(*---
description: concat_left applied to double_at, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_left_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) @@ (2 :> 3) \o <<9>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_left_double_at failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    (2 :> 3)
---*)
