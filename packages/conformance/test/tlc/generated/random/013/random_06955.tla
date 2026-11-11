(*---
description: Evaluates a random function expression, seed 262, number 6955.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06955 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b10638 \in ((SUBSET {1} \ SUBSET {1}) \ UNION {{x \in 1..3 : x > 1}, {1, 2}}) |-> ([[x \in Nat |-> x + 1] EXCEPT ![3] = 2])[(FALSE = [x \in Nat |-> x + 1])]] EXCEPT ![Len(SubSeq(<<-1, 1>>, IF FALSE THEN -1 ELSE 0, (CHOOSE b10639 \in {x \in 1..3 : x > 1} : FALSE)))] = (Head({7, 2}) % (CHOOSE b10640 \in UNION {{2, 1, 3}, <<3, 1, 2>>} : (b10640 \in {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06955 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 233 to line 14, col 278 of module random_06955
---*)
