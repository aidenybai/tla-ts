(*---
description: Evaluates a random set expression, seed 262, number 3907.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03907 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((<<5, 6>> @@ (1 :> 2)))[([a |-> 1, b |-> TRUE]).a] : b6156 \in (UNION {SUBSET {1}, {x \in 1..3 : x > 1}} \cap (1..3 \ {1}))} \ {((2147483647 - 3) - (7 + 1)), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1]).a}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03907 failed.
    Attempted to compare integer 2 with non-integer:
    {}
---*)
