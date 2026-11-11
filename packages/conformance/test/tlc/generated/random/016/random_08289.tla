(*---
description: Evaluates a random function expression, seed 262, number 8289.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08289 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b12834 \in {b12835 \in ((1 :> 2) \cap {x \in 1..3 : x > 1}) : (FALSE \/ FALSE)} : ((Nat \subseteq [x \in Nat |-> x + 1]) /\ DOMAIN [x \in Nat |-> x + 1])} \subseteq (((1..3 \ Nat) \cup ({} \ SUBSET {1})) \cap {IF FALSE THEN b12836 ELSE b12836 : b12836 \in UNION {{x \in 1..3 : x > 1}, {}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08289 failed.
    Attempted to check if the value:
    2
    is an element of the function <<2>>
---*)
