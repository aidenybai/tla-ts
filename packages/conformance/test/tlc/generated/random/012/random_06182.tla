(*---
description: Evaluates a random int expression, seed 262, number 6182.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06182 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b9513 \in ({(CHOOSE b9515 \in SUBSET {1} : FALSE) : b9514 \in {2147483647, (1 :> 2)}} \cup {b9516 \in ({2, 1, 3} \ {}) : (b9516 = 0)}) : ((UNION {b9513, {2, 1, 3}} = {b9513, b9513}) \/ ((CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE) = ([a |-> 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06182 failed.
    Attempted to compare the function <<2>> with the value:
    2147483647
---*)
