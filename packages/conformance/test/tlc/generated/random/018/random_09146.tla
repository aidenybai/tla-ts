(*---
description: Evaluates a random seq expression, seed 262, number 9146.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09146 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(Append(<<-1, [a |-> 1]>>, (2147483647 * 1)), LAMBDA p, q : p < q), (CHOOSE b14208 \in ({b14209 : b14209 \in 2..1} \ (Nat \ SUBSET {1})) : (([x \in 1..2 |-> x])[2147483647] < (b14208 % b14208))), IF ((TRUE /\ TRUE) <=> (TRUE \/ FALSE)) THEN (CHOOSE b14210 \in {2147483647, 2} : (~[a |-> 1, b |-> TRUE])) ELSE CASE (<<1, 2>> = 1) -> Head(<<>>) [] OTHER -> ([a |-> 1, b |-> TRUE]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09146 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 1]
---*)
