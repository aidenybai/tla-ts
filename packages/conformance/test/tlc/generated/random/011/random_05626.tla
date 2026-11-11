(*---
description: Evaluates a random bool expression, seed 262, number 5626.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05626 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (({} \cap <<3, 1, 2>>) = {2147483647, 2}) THEN CASE (FALSE /\ TRUE) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> Append(<<1, 2>>, -1) ELSE (Cardinality(SUBSET {1}) - LET b8696 == 3 IN 2147483647) < ((Head(<<1, 2>>) + (-1 + 1)) - CASE (<<5, 6>> \/ FALSE) -> ([x \in 1..2 |-> x])[0] [] OTHER -> CASE TRUE -> -1 [] OTHER -> 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05626 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a tuple.
    line 14, col 251 to line 14, col 267 of module random_05626
---*)
