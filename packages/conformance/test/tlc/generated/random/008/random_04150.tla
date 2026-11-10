(*---
description: Evaluates a random set expression, seed 262, number 4150.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04150 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Len([<<3, 1, 2>> EXCEPT ![1] = 2]), ((1 \div 3) - Head(<<1, 2>>))} \cap {b6533 \in {b6534 \in UNION {SUBSET {1}, {x \in 1..3 : x > 1}} : (TRUE \/ TRUE)} : ([<<3, 1, 2>> EXCEPT ![1] = b6533] = (b6533 :> 0))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04150 failed.
    Attempted to compare integer 2 with non-integer:
    {}
---*)
