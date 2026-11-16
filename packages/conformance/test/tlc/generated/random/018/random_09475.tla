(*---
description: Evaluates a random set expression, seed 262, number 9475.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09475 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{SortSeq(<<0, 0>>, LAMBDA p, q : p < q) : b14724 \in DOMAIN ((1 :> 2) @@ <<5, 6>>)}, DOMAIN ((3 :> 1) @@ [<<5, 6>> EXCEPT ![0] = -1])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 129 to line 14, col 136 of module random_09475
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09475 failed.
    Attempted to check equality of the function <<0, 0>> with the value:
    1
---*)
