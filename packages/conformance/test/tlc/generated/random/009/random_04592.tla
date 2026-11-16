(*---
description: Evaluates a random record expression, seed 262, number 4592.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04592 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (UNION {({1, 2} \cap [x \in Nat |-> x + 1]), DOMAIN [x \in 1..2 |-> x]} \cup {b7195 \in {2147483647, 2} : (\E b7196 \in {} : {2, 1, 3})}), b |-> (~[a |-> (-<<1>>), b |-> (TRUE => TRUE)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04592 failed.
    Attempted to check if the value:
    1
    is an element of the function [x \in Nat |-> <expression line 14, col 59 to line 14, col 63 of module random_04592>]
---*)
