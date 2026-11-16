(*---
description: Evaluates a random set expression, seed 262, number 119.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00119 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b183 \in ({LET b184 == [a |-> 1] IN 3, (2147483647 * 7)} \ ((1 :> 1) .. (CHOOSE b185 \in {1} : FALSE))) : (Append(<<3, -1>>, (b183 * 3)) = ([(1 :> 2) EXCEPT ![2] = 7] @@ [b186 \in 1..3 |-> b183]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00119 failed.
    2178:0 Overflow when computing 2147483647*7
---*)
