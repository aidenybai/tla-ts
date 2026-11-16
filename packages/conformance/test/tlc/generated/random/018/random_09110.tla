(*---
description: Evaluates a random record expression, seed 262, number 9110.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09110 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (([x \in 1..2 |-> x] @@ <<5, 6>>))[Cardinality((1 :> 2))], b |-> ((1 < 2147483647) => (TRUE /\ TRUE))] EXCEPT !.a = @ + (-(CHOOSE b14157 \in (FALSE \ Nat) : (<<5, 6>> = <<5, 6>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09110 failed.
    2181:0 Attempted to compute cardinality of the value
    <<2>>
---*)
