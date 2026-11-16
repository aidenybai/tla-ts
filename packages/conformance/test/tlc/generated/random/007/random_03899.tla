(*---
description: Evaluates a random set expression, seed 262, number 3899.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03899 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b6136 \in ((UNION {{2, 1, 3}, {1, 2}} \cup UNION {{}, {2, 1, 3}}) \cap ({-1, 3} \ {2, 2})) : [(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + (-Head(<<1>>))]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03899 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a record.
    line 14, col 110 to line 14, col 186 of module random_03899
---*)
