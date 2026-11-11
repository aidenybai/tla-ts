(*---
description: Evaluates a random bool expression, seed 262, number 3510.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03510 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b5544 \in ((({x \in 1..3 : x > 1} \cap {2, 1, 3}) \cup {b5545 : b5545 \in SUBSET {1}}) \cap ((1..3 \cup 2..1) \ (2147483647 .. 7))) : ({b5546 \in {0, b5544} : (b5544 \in SUBSET {1})} \subseteq DOMAIN [b5547 \in {1} |-> b5547])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03510 failed.
    Attempted to compare the set {} with the value:
    3
---*)
