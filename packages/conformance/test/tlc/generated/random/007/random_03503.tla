(*---
description: Evaluates a random record expression, seed 262, number 3503.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03503 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((7 :> 0))[IF FALSE THEN 3 ELSE 2], b |-> (~(\A b5530 \in Nat : FALSE))] EXCEPT !.a = @ + LET b5531 == Cardinality((1..3 \ {1, 2})) IN ((FALSE \div b5531) - (CHOOSE b5532 \in 2..1 : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03503 failed.
    Attempted to apply function:
    (7 :> 0)
    to argument 2, which is not in the domain of the function.
---*)
