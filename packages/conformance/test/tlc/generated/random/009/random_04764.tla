(*---
description: Evaluates a random function expression, seed 262, number 4764.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04764 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7437 \in {b7438 \in DOMAIN [b7439 \in {2, 1, 3} |-> b7439] : (\E b7440 \in DOMAIN [x \in 1..2 |-> x] : [[a |-> 1, b |-> TRUE] EXCEPT !.a = b7440])} |-> (((FALSE /\ TRUE) @@ (2 :> b7437)))[LET b7441 == (0 + -1) IN ([x \in 1..2 |-> x])[2147483647]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04764 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 80 to line 14, col 162 of module random_04764
---*)
