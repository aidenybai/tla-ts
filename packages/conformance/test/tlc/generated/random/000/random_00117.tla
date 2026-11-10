(*---
description: Evaluates a random function expression, seed 262, number 117.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00117 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b177 \in (({0 : b178 \in {2, 1, 3}} \cap [[a |-> 1] EXCEPT !.a = @ + 1]) \cup ((2..1 \cap {1, 2}) \cup {b179 \in 1..3 : FALSE})) |-> (Len(SubSeq(2..1, b177, b177)) + ([b180 \in Nat |-> b177])[LET b181 == -1 IN 1])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00117 failed.
    Attempted to check if element:
    0
    is in the record:
    [a |-> 2]
---*)
