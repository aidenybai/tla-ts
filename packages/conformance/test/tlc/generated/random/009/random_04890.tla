(*---
description: Evaluates a random function expression, seed 262, number 4890.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04890 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([<<2, 2147483647>> EXCEPT ![1] = {b7612 \in {1} : TRUE}]) :> ((((1 :> 2))[3] :> IF FALSE THEN 3 ELSE -1))[(CASE TRUE -> 2147483647 [] OTHER -> {1} - Cardinality([x \in 1..2 |-> x]))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04890 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
