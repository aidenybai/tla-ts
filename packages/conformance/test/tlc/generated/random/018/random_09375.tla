(*---
description: Evaluates a random bool expression, seed 262, number 9375.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09375 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SubSeq(Tail(<<1>>), (-1 + 7), CASE TRUE -> -1 [] OTHER -> 2147483647) = [b14551 \in UNION {{x \in 1..3 : x > 1}, SUBSET {1}} |-> Len(<<1, 2>>)]) => ([a |-> (CHOOSE b14552 \in {} : TRUE), b |-> (<<1, 2>> = <<5, 6>>)] = [a |-> (0 + 2), b |-> (TRUE /\ FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09375 failed.
    Attempted to compare the set {} with the value:
    2
---*)
