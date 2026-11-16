(*---
description: Evaluates a random function expression, seed 262, number 7723.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07723 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE))[Head(<<>>)] :> (([x \in Nat |-> x + 1] :> 1))[(TRUE <=> FALSE)]) EXCEPT ![Head(Head(<<0, 2>>))] = Head((CASE FALSE -> 1 [] OTHER -> 2 :> (CHOOSE b11908 \in {1, 2} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07723 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
