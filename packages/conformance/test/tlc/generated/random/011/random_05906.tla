(*---
description: Evaluates a random function expression, seed 262, number 5906.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05906 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9111 \in (UNION {({1} \ Nat), ([a |-> 1, b |-> TRUE] \cup {x \in 1..3 : x > 1})} \ UNION {DOMAIN TRUE, ({x \in 1..3 : x > 1} \cup {})}) |-> ([b9112 \in {b9113 \in {1} : FALSE} |-> (b9112 + 3)])[(([a |-> 1] % 3) + (-2147483647))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05906 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a Boolean value)
    line 14, col 108 to line 14, col 118 of module random_05906
---*)
