(*---
description: Evaluates a random seq expression, seed 262, number 1529.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01529 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b2427 \in UNION {{LET b2429 == 2147483647 IN b2428 : b2428 \in ({1, 2} \cap {2, 1, 3})}, {Len(<<1, 2>>), IF FALSE THEN 1 ELSE 2147483647}} : (([[x \in Nat |-> x + 1] EXCEPT ![2] = -1])[(2 % 3)] \in ((2..1 \cup {1, 2}) \cup (SUBSET {1} \ 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01529 failed.
    Attempted to check if the non-enumerable value
    -1
    is element of
    {{}, {1}}
---*)
