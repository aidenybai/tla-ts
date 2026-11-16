(*---
description: Evaluates a random bool expression, seed 262, number 1034.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01034 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 .. 2147483647) \subseteq (2147483647 .. 0)) <=> (([a |-> 1] = [a |-> 1, b |-> TRUE]) /\ ({2, 1, 3} \subseteq 1..3))) /\ (\E b1660 \in DOMAIN ((1 :> 2) @@ (1 :> 2)) : ((-b1660) = (<<1>>).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01034 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
