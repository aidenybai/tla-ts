(*---
description: Evaluates a random bool expression, seed 262, number 7526.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07526 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ({b11597 \in 2..1 : TRUE} = (Nat \cap {})) -> [a |-> Head(<<1>>), b |-> (0 \in [a |-> 1, b |-> TRUE])] [] OTHER -> Head(SubSeq(<<3, 1, 2>>, 1, 7)) = [(([a |-> 1, b |-> TRUE]).a :> SortSeq(-1, LAMBDA p, q : p < q)) EXCEPT ![Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))] = Len([Nat EXCEPT ![1] = 3])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07526 failed.
    Attempted to check if element:
    0
    is in the record:
    [a |-> 1, b |-> TRUE]
---*)
