(*---
description: Evaluates a random set expression, seed 262, number 5458.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05458 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality((<<5, 6>> @@ (1 :> 2))) .. (-(7 - 2))) \ Len(<<Len(<<1, 2>>), (7 + 1)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05458 failed.
    2181:0 Attempted to compute cardinality of the value
    <<5, 6>>
---*)
