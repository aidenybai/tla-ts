(*---
description: Evaluates a random seq expression, seed 262, number 5839.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05839 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Cardinality({0, 2}) \div (CASE FALSE -> -1 [] OTHER -> 2 % LET b9002 == -1 IN b9002)), ([[a |-> -1, b |-> [x \in 1..2 |-> x]] EXCEPT !.a = @ + ((1 :> 2))[7]]).a>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05839 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
