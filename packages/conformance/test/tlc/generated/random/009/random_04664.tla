(*---
description: Evaluates a random int expression, seed 262, number 4664.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04664 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(DOMAIN [b7287 \in {1, 2} |-> 1]) + ((CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE))[LET b7288 == [[a |-> 1] EXCEPT !.a = <<1, 2>>] IN ([x \in 1..2 |-> x])[b7288]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04664 failed.
    Attempted to check if the value:
    [a |-> <<1, 2>>]
    is in the integer interval 1..2
---*)
