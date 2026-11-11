(*---
description: Evaluates a random set expression, seed 262, number 5902.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05902 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b9101 \in {Head(<<>>) : b9102 \in DOMAIN [x \in 1..2 |-> x]} : ((b9101 % 1) = LET b9103 == b9101 IN 2147483647)} \cup ((({x \in 1..3 : x > 1} \ [a |-> 1]) \cup UNION {SUBSET {1}, {}}) \cup {(b9104 * 0) : b9104 \in {-1 : b9105 \in {x \in 1..3 : x > 1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05902 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
