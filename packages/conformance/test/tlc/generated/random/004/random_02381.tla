(*---
description: Evaluates a random int expression, seed 262, number 2381.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02381 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b3774 \in {Head(SelectSeq(<<>>, LAMBDA e : e > 0)), ([b3775 \in {} |-> -1])[([a |-> 1]).a]} : (IF {b3776 : b3776 \in Nat} THEN [[x \in 1..2 |-> x] EXCEPT ![b3774] = 2147483647] ELSE ([a |-> 1, b |-> TRUE] = [a |-> 1]) = Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02381 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
