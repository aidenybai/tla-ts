(*---
description: Evaluates a random record expression, seed 262, number 8341.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08341 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality(((CHOOSE f \in [{0} \cup {1} -> 1..2] : TRUE) @@ [b12903 \in {2, 1, 3} |-> 2147483647])), b |-> ([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + (2 - 1)] \in {b12904 \in {b12905 \in 1..3 : FALSE} : (TRUE /\ FALSE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08341 failed.
    2181:0 Attempted to compute cardinality of the value
    (0 :> 1 @@ 1 :> 1 @@ 2 :> 2147483647 @@ 3 :> 2147483647)
---*)
