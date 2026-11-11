(*---
description: Evaluates a random int expression, seed 262, number 2933.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02933 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((\E b4639 \in {b4640 \in SUBSET {1} : TRUE} : (\E b4641 \in {1, 2} : TRUE)) <=> ({b4642 \in Nat : TRUE} <=> (2147483647 \in 1..3))) THEN Cardinality((LET b4643 == 2..1 IN b4643 .. (2 - 3))) ELSE Cardinality((UNION {{1}, {x \in 1..3 : x > 1}} \ (Nat \ {}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02933 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 101 to line 14, col 148 of module random_02933
---*)
