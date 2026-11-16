(*---
description: Evaluates a random set expression, seed 262, number 1001.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01001 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Len(SubSeq(<<1, 2>>, b1610, b1610)) : b1610 \in UNION {(SUBSET {1} \ {2, 1, 3}), ({x \in 1..3 : x > 1} \ 1..3)}} \ ((DOMAIN [x \in 1..2 |-> x] \cap (0 .. 0)) \cap {b1611 \in DOMAIN <<5, 6>> : ([a |-> 1] = [a |-> 1, b |-> TRUE])})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01001 failed.
    Attempted to check equality of integer 2 with non-integer:
    {}
---*)
