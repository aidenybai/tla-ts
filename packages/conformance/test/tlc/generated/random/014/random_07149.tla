(*---
description: Evaluates a random int expression, seed 262, number 7149.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07149 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b10984 \in ((CHOOSE f \in [{1, 2} \ {1} -> 1..2] : TRUE) \ DOMAIN (7 :> 3)) : ([b10985 \in (2147483647 .. -1) |-> IF TRUE THEN b10984 ELSE 2] = Cardinality(DOMAIN FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07149 failed.
    Attempted to enumerate S \ T when S:
    (2 :> 1)
    is not enumerable.
---*)
