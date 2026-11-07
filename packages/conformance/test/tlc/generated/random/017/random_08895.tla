(*---
description: Evaluates a random int expression, seed 262, number 8895.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08895 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (SortSeq(<<>>, LAMBDA p, q : p < q) = (2147483647 :> 1)) THEN CASE (1 \in Nat) -> (<<1>> % -1) [] OTHER -> IF FALSE THEN 2 ELSE 7 ELSE LET b13775 == Head(<<1>>) IN Head(FALSE) % ((((1 :> 2) @@ [a |-> 1, b |-> TRUE]) @@ <<7, 2>>))[(CHOOSE b13776 \in ({1, 2} \cup SUBSET {1}) : (~TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)
