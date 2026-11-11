(*---
description: Evaluates a random set expression, seed 262, number 6449.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06449 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [[b9926 \in {} |-> b9926] EXCEPT ![(2 % -1)] = (CHOOSE b9927 \in {2, 1, 3} : TRUE)] \cup UNION {{((1 :> 2))[-1], Head(<<1>>)}, {b9928 \in {2 : b9929 \in {1}} : (b9928 < b9928)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06449 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
