(*---
description: Evaluates a random record expression, seed 262, number 2968.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02968 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b4708 \in {((1 :> 2))[3], (-0)} : ((1 = [a |-> 1, b |-> TRUE]) \/ (2147483647 \in {2, 1, 3}))} \subseteq DOMAIN [b4709 \in (Nat \cap {2, 1, 3}) |-> LET b4710 == b4709 IN 2147483647]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02968 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
