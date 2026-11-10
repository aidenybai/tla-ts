(*---
description: Evaluates a random set expression, seed 262, number 2497.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02497 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b3932 \in (((1 :> 2) @@ (1 :> 2)))[(b3931 \div b3931)] : (([a |-> 1] \/ FALSE) => (FALSE /\ FALSE))) : b3931 \in ((CHOOSE b3933 \in (-1 .. 7) : (FALSE => FALSE)) .. Cardinality(Cardinality(2..1)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02497 failed.
    2181:0 Attempted to compute cardinality of the value
    0
---*)
