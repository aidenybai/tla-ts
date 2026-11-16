(*---
description: Evaluates a random int expression, seed 262, number 2538.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02538 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b4000 \in UNION {<<1>>, {1}} |-> (CHOOSE b4001 \in 1..3 : TRUE)] @@ ([[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 7] @@ (CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE))))[(Len(SelectSeq(TRUE, LAMBDA e : e > 0)) * CASE ({1, 2} = {1, 2}) -> (TRUE \div 0) [] OTHER -> (2 + 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02538 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
