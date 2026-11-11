(*---
description: Evaluates a random set expression, seed 262, number 4044.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04044 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b6360 \in ({b6361 \in {2, 1, 3} : TRUE} \cap (SUBSET {1} \cup 2..1)) : (\E b6362 \in (SUBSET {1} \cup 2..1) : (b6362 = [a |-> 1]))} \ {([b6364 \in {1, 2} |-> 3] - (b6363 - 2147483647)) : b6363 \in {((1 :> 2))[1], (CHOOSE b6365 \in {x \in 1..3 : x > 1} : TRUE)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04044 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
