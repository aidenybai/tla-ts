(*---
description: Evaluates a random set expression, seed 262, number 2103.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02103 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b3339 \in {7 : b3340 \in SUBSET {1}} |-> (b3339 % b3339)] = [([b3341 \in {1} |-> 2147483647] @@ (CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE)) EXCEPT ![Head([<<1>> EXCEPT ![1] = 3])] = (SubSeq(<<1>>, -1, 7) < (-7))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 87 to line 14, col 167 of module random_02103
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02103 failed.
    Attempted to check equality of the set {7} with the value:
    <<2147483647, 2>>
---*)
