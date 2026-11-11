(*---
description: Evaluates a random bool expression, seed 262, number 7172.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07172 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b11018 == (IF FALSE THEN 2147483647 ELSE 3 \div (CHOOSE b11019 \in {1} : FALSE)) IN (([x \in Nat |-> x + 1])[3] + Cardinality(1..3)) \in {CASE [{1} EXCEPT ![1] = [a |-> 1]] -> (2147483647 % 0) [] OTHER -> [b11020 \in SUBSET {1} |-> 2], IF (2147483647 < -1) THEN ((1 :> 2))[1] ELSE SortSeq(<<>>, LAMBDA p, q : p < q)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07172 failed.
    Attempted to apply EXCEPT construct to the value {1}.
---*)
