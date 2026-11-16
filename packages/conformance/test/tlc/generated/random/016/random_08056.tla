(*---
description: Evaluates a random int expression, seed 262, number 8056.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08056 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((([x \in Nat |-> x + 1] \cap {}) = [<<1>> EXCEPT ![1] = 0]) => ((FALSE /\ TRUE) /\ (FALSE /\ TRUE))) -> (Head((-1 \o <<1, 2>>)) - (([a |-> 1]).a % Len(<<3, 1, 2>>))) [] OTHER -> LET b12446 == ([<<5, 6>> EXCEPT ![2147483647] = 3])[([x \in 1..2 |-> x])[7]] IN ((b12446 :> b12446))[(-b12446)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08056 failed.
    Attempted to check equality of the set {} with the value:
    <<0>>
---*)
