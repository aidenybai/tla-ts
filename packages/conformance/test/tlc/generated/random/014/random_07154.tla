(*---
description: Evaluates a random bool expression, seed 262, number 7154.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07154 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b10997 \in ({} \cup 2..1) : (b10997 = b10997)} \cap DOMAIN (<<5, 6>> @@ [x \in 1..2 |-> x])) = ({b10998 \in {b10999 \in 1..3 : FALSE} : (<<1, 2>> = [x \in Nat |-> x + 1])} \ {(-1 % -1), ((1 :> 2))[2]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07154 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
