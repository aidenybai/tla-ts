(*---
description: Evaluates a random set expression, seed 262, number 4093.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04093 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {UNION {{<<3, 1, 2>> : b6436 \in {x \in 1..3 : x > 1}}, (1..3 \cap {})}, {(1 \div 3), Head(<<3, 1, 2>>)}}, ({((1 :> 2))[-1], Len(<<3, 1, 2>>)} \cap ({b6437 : b6437 \in {x \in 1..3 : x > 1}} \cup {2, 2}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04093 failed.
    Attempted to check equality of the function <<3, 1, 2>> with the value:
    0
---*)
