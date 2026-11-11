(*---
description: Evaluates a random bool expression, seed 262, number 9886.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09886 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b15368 \in ((({1, 2} \cup SUBSET {1}) \ {2147483647, <<1>>}) \ {([x \in Nat |-> x + 1])[7], (-1 % 2147483647)}) : (((-b15368) \in {b15369 : b15369 \in 1..3}) <=> ((TRUE => TRUE) <=> (TRUE /\ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09886 failed.
    Attempted to check equality of the function <<1>> with the value:
    1
---*)
