(*---
description: Evaluates a random set expression, seed 262, number 3173.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03173 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((((1 :> 2) @@ (1 :> 2)))[Len(<<3, 1, 2>>)] .. Head((<<1, 2>> \o <<1, 2>>))) \cup (UNION {(CHOOSE b5053 \in {2, 1, 3} : TRUE), {1 : b5054 \in {x \in 1..3 : x > 1}}} \cap {Head(<<>>) : b5055 \in (2..1 \cap 1..3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03173 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
