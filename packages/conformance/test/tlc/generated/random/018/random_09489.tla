(*---
description: Evaluates a random record expression, seed 262, number 9489.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09489 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([[x \in Nat |-> x + 1] EXCEPT ![(1 :> 2)] = 1])[IF FALSE THEN 2 ELSE 2] : b14740 \in (((1 :> 2))[-1] \cap {2, 2147483647})} \subseteq {LET b14742 == ([a |-> 1, b |-> TRUE]).a IN (2 % b14742) : b14741 \in (UNION {<<5, 6>>, {x \in 1..3 : x > 1}} \ ({} \ 1..3))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09489 failed.
    Attempted to apply function:
    <<2>>
    to argument -1, which is not in the domain of the function.
---*)
