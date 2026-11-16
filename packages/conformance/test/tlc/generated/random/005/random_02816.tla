(*---
description: Evaluates a random set expression, seed 262, number 2816.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02816 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b4470 \in {b4471 \in {2147483647 : b4472 \in SUBSET {1}} : (TRUE \/ TRUE)} : ((1..3 \cap 1..3) \subseteq [[a |-> 1, b |-> TRUE] EXCEPT !.a = b4470])} \ {b4473 \in UNION {UNION {{}, Nat}, {0, 2147483647}} : (([x \in 1..2 |-> x])[b4473] < Len(<<>>))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02816 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 2147483647, b |-> TRUE]
---*)
