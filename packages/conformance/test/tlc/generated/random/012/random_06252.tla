(*---
description: Evaluates a random record expression, seed 262, number 6252.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06252 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Len((<<1, 2>> \o 7)) - (LET b9634 == 2147483647 IN b9634 - Head(<<3, 1, 2>>))), b |-> (({2, 1} \subseteq ({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1})) /\ (\E b9635 \in (1 .. 1) : (<<3, 1, 2>> = <<5, 6>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06252 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    7
---*)
