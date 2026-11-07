(*---
description: Evaluates a random bool expression, seed 262, number 8237.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08237 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b12747 \in ((CHOOSE b12748 \in DOMAIN (1 :> 2) : ({1, 2} \subseteq Nat)) .. ([[a |-> 1] EXCEPT !.a = @ + 3] - (2147483647 * 2))) : (([<<3, 1, 2>> EXCEPT ![1] = b12747] = (CHOOSE f \in [1..2 -> 1..2] : TRUE)) /\ ([[a |-> 1] EXCEPT !.a = @ + b12747] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*2
    2178:0 Overflow when computing 2147483647*2
---*)
