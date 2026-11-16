(*---
description: Evaluates a random record expression, seed 262, number 5471.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05471 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[<<1, 2>> EXCEPT ![1] = SUBSET {1}] EXCEPT !.a = @ + (1 * 3)] EXCEPT !.a = @ + ([b8467 \in {x \in 1..3 : x > 1} |-> 2147483647])[([a |-> 1]).a]] EXCEPT !.a = (((2147483647 % 3) :> ([x \in 1..2 |-> x])[7]) - Head((<<3, 1, 2>> \o <<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05471 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
