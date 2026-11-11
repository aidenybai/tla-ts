(*---
description: Evaluates a random bool expression, seed 262, number 5094.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05094 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b7922 \in (UNION {DOMAIN (1 :> 2), [[a |-> 1] EXCEPT !.a = @ + 1]} \cup ([b7923 \in {1, 2} |-> b7923] \ (2..1 \cap TRUE))) : ([Tail(<<1>>) EXCEPT ![1] = ([x \in 1..2 |-> x])[b7922]] = [b7924 \in {b7922, TRUE} |-> (2 \div b7924)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05094 failed.
    Attempted to compare record:
    [a |-> 2]
    with non-record
    {1}
---*)
