(*---
description: Evaluates a random function expression, seed 262, number 6643.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06643 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b10193 \in DOMAIN [b10194 \in SUBSET {1} |-> 3] |-> (CHOOSE b10195 \in {b10193, 1} : (<<5, 6>>)[b10195])] EXCEPT ![((LET b10196 == 7 IN b10196 - (2 % -1)) \div (-Len(<<3, 1, 2>>)))] = CASE (\E b10197 \in (3 .. 2) : [a |-> b10197, b |-> FALSE]) -> (-Head(<<>>)) [] OTHER -> (-Cardinality({}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06643 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
