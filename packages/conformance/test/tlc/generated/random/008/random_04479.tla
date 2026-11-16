(*---
description: Evaluates a random record expression, seed 262, number 4479.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04479 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((CHOOSE r \in [a : {1, 2}] : TRUE)).a * (((1 :> 2))[0] * (3 * 7))), b |-> (((<<1, 2>> = Nat) /\ (<<1>> = [x \in Nat |-> x + 1])) /\ ((CHOOSE b7043 \in {1} : TRUE) < CASE TRUE -> [a |-> 1, b |-> TRUE] [] OTHER -> 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04479 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
