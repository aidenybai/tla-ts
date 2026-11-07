(*---
description: Evaluates a random set expression, seed 262, number 1301.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01301 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2067 \in (((1 :> 2147483647))[(-7)] .. (-[[a |-> 1] EXCEPT !.a = @ + 1])) : (Cardinality((1..3 \ {1, 2})) < ((-b2067) - IF TRUE THEN 2 ELSE 1))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01301 failed.
    Attempted to apply function:
    <<2147483647>>
    to argument -7, which is not in the domain of the function.
---*)
