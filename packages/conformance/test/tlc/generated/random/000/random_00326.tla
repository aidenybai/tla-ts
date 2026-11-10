(*---
description: Evaluates a random set expression, seed 262, number 326.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00326 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b546 \in DOMAIN ((0 :> 0) @@ (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE)) : ({b547 \in ({} \cup {x \in 1..3 : x > 1}) : (TRUE <=> FALSE)} = [[a |-> b546, b |-> TRUE] EXCEPT !.a = @ + LET b548 == b546 IN b548])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00326 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 47 to line 14, col 86 of module random_00326
---*)
