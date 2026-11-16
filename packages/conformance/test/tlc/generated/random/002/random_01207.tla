(*---
description: Evaluates a random int expression, seed 262, number 1207.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01207 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b1942 \in {b1943 \in ((7 .. 3) \cup Cardinality({1, 2})) : (CASE TRUE -> b1943 [] OTHER -> b1943 \in [b1944 \in SUBSET {1} |-> 3])} : (\A b1945 \in ({0 : b1946 \in 2..1} \ (0 .. b1942)) : (<<b1942, b1942>> = ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01207 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    2
    is not enumerable
---*)
