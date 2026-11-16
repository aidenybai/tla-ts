(*---
description: Evaluates a random function expression, seed 262, number 1046.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01046 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((CHOOSE f \in [2..1 -> {1, 2}] : TRUE) @@ ((1 :> 2) @@ (1 :> 2))) @@ (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE)) EXCEPT ![(CHOOSE b1679 \in (({x \in 1..3 : x > 1} \ SUBSET {1}) \cap {7 : b1680 \in {1, 2}}) : (~(\A b1681 \in {2, 1, 3} : FALSE)))] = <<((-1) \div (3 \div 2147483647)), (CHOOSE b1682 \in (2147483647 .. 0) : (TRUE /\ TRUE))>>])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01046 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
