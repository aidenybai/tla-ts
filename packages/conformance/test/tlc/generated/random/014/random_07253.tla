(*---
description: Evaluates a random bool expression, seed 262, number 7253.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07253 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b11155 \in ({b11156 \in {b11157 \in Nat : TRUE} : (\A b11158 \in Nat : FALSE)} \ UNION {(3 .. 3), {3, 3}}) : (\A b11159 \in ({b11160 \in Nat : FALSE} \ (7 .. b11155)) : (<<[a |-> 1, b |-> TRUE], b11159>> = (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07253 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
