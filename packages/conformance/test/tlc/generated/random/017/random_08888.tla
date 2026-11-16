(*---
description: Evaluates a random seq expression, seed 262, number 8888.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08888 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<IF (TRUE => TRUE) THEN ((1 :> 2))[7] ELSE (-7), ([a |-> 0, b |-> FALSE]).a>> \o Append([LET b13770 == 2 IN b13770 EXCEPT ![1] = (-1 % 2)], ([b13771 \in 2..1 |-> b13771])[IF TRUE THEN 2 ELSE 3])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08888 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
