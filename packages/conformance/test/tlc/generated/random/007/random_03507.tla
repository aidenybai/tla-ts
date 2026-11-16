(*---
description: Evaluates a random set expression, seed 262, number 3507.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03507 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({<<1>> : b5537 \in {2, 1, 3}} \ (2..1 \cap 1..3)) \cup {b5538 \in ({x \in 1..3 : x > 1} \cup {1}) : (\A b5539 \in {2, 1, 3} : TRUE)}) \cup ({Cardinality({}) : b5540 \in {b5541 : b5541 \in {x \in 1..3 : x > 1}}} \cap {b5542 \in (0 .. -1) : ({x \in 1..3 : x > 1} = Nat)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03507 failed.
    Attempted to check equality of the function <<1>> with the value:
    1
---*)
