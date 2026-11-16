(*---
description: Evaluates a random seq expression, seed 262, number 8213.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08213 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {SortSeq((<<>> \o <<1, 2>>), LAMBDA p, q : p < q), UNION {({2, 1, 3} \cap 1), {b12713 \in {} : FALSE}}} \ UNION {({b12714 \in {} : TRUE} \cup DOMAIN [x \in 1..2 |-> x]), {b12715 \in ({2, 1, 3} \subseteq {1, 2}) : (\E b12716 \in Nat : TRUE)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08213 failed.
    Attempted to check if the value:
    2
    is an element of the integer 1
---*)
