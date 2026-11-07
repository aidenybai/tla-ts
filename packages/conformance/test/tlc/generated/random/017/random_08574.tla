(*---
description: Evaluates a random bool expression, seed 262, number 8574.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08574 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Cardinality(({x \in 1..3 : x > 1} = SUBSET {1})) :> ((CHOOSE r \in [a : {1, 2}] : TRUE)).a) EXCEPT ![(-(CHOOSE b13286 \in (<<1>> .. {2, 1, 3}) : (3 \in {1})))] = (((FALSE /\ TRUE) => ([a |-> 1, b |-> TRUE] = [a |-> 1])) + (CHOOSE b13287 \in ({x \in 1..3 : x > 1} \ {1, 2}) : {1 : b13288 \in 1..3}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08574 failed.
    Attempted to check equality of integer 2 with non-integer:
    {}
---*)
