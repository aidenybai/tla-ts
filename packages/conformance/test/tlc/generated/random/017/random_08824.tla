(*---
description: Evaluates a random function expression, seed 262, number 8824.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08824 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13661 \in (CASE (<<1>> = <<5, 6>>) -> (2 * 1) [] OTHER -> (1 * 3) .. (((1 :> 2))[7] * (2147483647 * 3))) |-> ((CHOOSE f \in [{2, 1, 3} -> {}] : TRUE))[IF (FALSE \/ TRUE) THEN [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b13661] ELSE (b13661 \div 2147483647)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08824 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
