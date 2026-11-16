(*---
description: Evaluates a random int expression, seed 262, number 7946.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07946 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE))[([(<<5, 6>> @@ <<5, 6>>) EXCEPT ![[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]] = CASE TRUE -> 0 [] OTHER -> [x \in 1..2 |-> x]])[IF (~TRUE) THEN ([x \in 1..2 |-> x])[7] ELSE (3 % 0)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07946 failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 8, b |-> TRUE]
---*)
