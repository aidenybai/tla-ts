(*---
description: Evaluates a random bool expression, seed 262, number 9187.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09187 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<([x \in Nat |-> x + 1])[TRUE], ([a |-> 1]).a>> = ((-1 + 0) :> (7 - 0))) <=> (~(\A b14257 \in {-1 : b14258 \in 1..3} : (\E b14259 \in {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09187 failed.
    2158:0 Attempted to check if the value:
    TRUE
    is an element of Nat.
---*)
