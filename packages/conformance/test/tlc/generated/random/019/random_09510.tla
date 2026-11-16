(*---
description: Evaluates a random bool expression, seed 262, number 9510.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09510 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[((1 :> 2))[2147483647] EXCEPT !.a = IF TRUE THEN 1 ELSE 1] EXCEPT !.a = ((2147483647 * 7) * (7 \div 1))] = [a |-> (IF TRUE THEN -1 ELSE 3 * (7 * 2)), b |-> (CASE FALSE -> 3 [] OTHER -> 7 < (0 + 2147483647))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09510 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
