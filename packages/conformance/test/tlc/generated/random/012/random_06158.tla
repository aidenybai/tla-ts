(*---
description: Evaluates a random function expression, seed 262, number 6158.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06158 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (LET b9475 == 2147483647 IN 1 :> (0 \div 7)) = (DOMAIN [b9476 \in SUBSET {1} |-> 3] \cup {IF FALSE THEN 2147483647 ELSE 3, (-1 + 3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06158 failed.
    Attempted to compare the set {} with the value:
    3
---*)
