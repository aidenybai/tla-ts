(*---
description: Evaluates a random record expression, seed 262, number 4239.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04239 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> ({2, 1, 3} \subseteq <<3, 1, 2>>), b |-> (\E b6667 \in Nat : TRUE)] EXCEPT !.a = @ + ((7 + 1) % ([x \in Nat |-> x + 1])[3])] EXCEPT !.a = @ + (-IF (TRUE \/ TRUE) THEN (1 * 3) ELSE Cardinality(Nat))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04239 failed.
    Attempted to check set membership in a tuple value.
---*)
