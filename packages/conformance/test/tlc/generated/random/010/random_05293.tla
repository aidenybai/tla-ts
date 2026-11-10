(*---
description: Evaluates a random record expression, seed 262, number 5293.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05293 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CASE (<<3, 1, 2>> = (1 :> 2)) -> IF FALSE THEN 1 ELSE 7 [] OTHER -> Head(<<3, 1, 2>>) \div Cardinality((TRUE \cap {x \in 1..3 : x > 1}))), b |-> (((2147483647 < 3) + ([a |-> 1] = [a |-> 1, b |-> TRUE])) < ((-0) % (0 \div 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05293 failed.
    Attempted to check if the value:
    2
    is an element of the boolean TRUE
---*)
