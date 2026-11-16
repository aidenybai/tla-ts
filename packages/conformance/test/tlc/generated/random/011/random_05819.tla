(*---
description: Evaluates a random int expression, seed 262, number 5819.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05819 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b8970 \in ((({2, 1, 3} \cup 1..3) \cap {b8971 \in SUBSET {1} : TRUE}) \cap ((CHOOSE f \in [1..2 -> 1..2] : TRUE) @@ [b8972 \in Nat |-> 2])) : (((b8970 * 1) < ([a |-> 1]).a) /\ ({<<1>>, 2147483647} = DOMAIN [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05819 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
