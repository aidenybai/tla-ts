(*---
description: Evaluates a random int expression, seed 262, number 8917.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08917 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b13820 \in (((1..3 \cap {1}) \ [b13821 \in {x \in 1..3 : x > 1} |-> b13821]) \ (Append(<<3, 1, 2>>, -1) .. Len(<<>>))) : ([a |-> Len(<<3, 1, 2>>), b |-> (FALSE => FALSE)] = [a |-> ([x \in Nat |-> x + 1])[b13820], b |-> (\A b13822 \in {1, 2} : FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08917 failed.
    Attempted to check if the value:
    1
    is an element of the function (2 :> 2 @@ 3 :> 3)
---*)
