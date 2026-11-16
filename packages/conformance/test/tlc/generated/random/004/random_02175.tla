(*---
description: Evaluates a random set expression, seed 262, number 2175.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02175 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b3430 \in ((0 .. 3) \cap (Nat \ SUBSET {1})) : (\A b3431 \in (b3430 .. -1) : (\A b3432 \in 1..3 : TRUE))) <=> (Tail(SelectSeq(<<>>, LAMBDA e : e > 0)) = (CHOOSE f \in [{} -> 1..2] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02175 failed.
    Attempted to check if the non-enumerable value
    0
    is element of
    {{}, {1}}
---*)
