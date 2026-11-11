(*---
description: Evaluates a random int expression, seed 262, number 8124.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08124 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {((1 :> 2))[-1], {b12551 \in 1..3 : FALSE}} \ ((2 .. 0) \ UNION {{}, 2..1})) % LET b12552 == {b12553 \in ({1} \ {1, 2}) : (2..1 = {1, 2})} IN (([x \in 1..2 |-> x] < b12552) => (~TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08124 failed.
    Attempted to apply function:
    <<2>>
    to argument -1, which is not in the domain of the function.
---*)
