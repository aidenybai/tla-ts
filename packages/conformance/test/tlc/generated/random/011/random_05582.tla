(*---
description: Evaluates a random bool expression, seed 262, number 5582.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05582 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b8644 \in ({CASE TRUE -> 7 [] OTHER -> b8645 : b8645 \in {-1, 1}} \cap {([x \in Nat |-> x + 1])[2147483647], (CHOOSE b8646 \in {2, 1, 3} : FALSE)}) : (Cardinality((2..1 \cap {})) \in ((b8644 .. b8644) \cup {b8644, 0}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05582 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
