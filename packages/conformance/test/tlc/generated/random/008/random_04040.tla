(*---
description: Evaluates a random bool expression, seed 262, number 4040.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04040 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b6353 \in DOMAIN LET b6354 == 0 IN b6354 : ((<<1, 2>> \o <<1, 2>>) = (0 :> b6353))) <=> ((Head(<<>>) % (-2147483647)) < IF [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] THEN IF FALSE THEN 3 ELSE 7 ELSE (3 - -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04040 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 31 to line 14, col 60 of module random_04040
---*)
