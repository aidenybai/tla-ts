(*---
description: Evaluates a random set expression, seed 262, number 107.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00107 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({b164 \in {b165 : b165 \in {}} : (<<1, 2>> = [x \in 1..2 |-> x])} \cap {Len(<<>>) : b166 \in ({1, 2} \ {1})}), ((((1 :> 2))[0] + Len(<<1>>)) .. (LET b167 == 1 IN -1 + (1 + 2)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00107 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
