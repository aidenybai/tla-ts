(*---
description: Evaluates a random record expression, seed 262, number 4727.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04727 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((~(-1 = 3)) * (((1 :> 2) @@ (1 :> 2)))[(2147483647 + 0)]), b |-> (LET b7391 == LET b7392 == -1 IN b7392 IN (CHOOSE b7393 \in Nat : [a |-> 1, b |-> TRUE]) = (Cardinality(SUBSET {1}) \div CASE TRUE -> 2 [] OTHER -> 2147483647))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04727 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
