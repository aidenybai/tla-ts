(*---
description: Evaluates a random bool expression, seed 262, number 5505.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05505 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b8506 \in {IF (<<1>> = <<5, 6>>) THEN (b8507 - 7) ELSE Cardinality(2..1) : b8507 \in ([a |-> -1, b |-> TRUE] \cap ({x \in 1..3 : x > 1} \ SUBSET {1}))} : ((Head(<<>>) < CASE FALSE -> 3 [] OTHER -> b8506) /\ (\A b8508 \in ([x \in Nat |-> x + 1] @@ <<3, 1, 2>>) : (b8506 \in SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05505 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
