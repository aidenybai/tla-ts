(*---
description: Evaluates a random function expression, seed 262, number 7477.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07477 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11519 \in (DOMAIN (-1 :> 0) \cap ([b11520 \in {1} |-> 3] @@ ((1 :> 2) @@ [x \in 1..2 |-> x]))) |-> LET b11521 == ((1 \in 1..3) <=> (<<1, 2>> = {1, 2})) IN Cardinality((<<>> \cap SUBSET {1}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07477 failed.
    Attempted to check if the value:
    -1
    is an element of the function <<3, 2>>
---*)
