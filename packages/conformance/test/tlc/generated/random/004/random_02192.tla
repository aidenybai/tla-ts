(*---
description: Evaluates a random record expression, seed 262, number 2192.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02192 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (IF FALSE THEN 1 ELSE 2147483647 + Head(<<1>>)), b |-> (\A b3452 \in {1 : b3453 \in Nat} : (<<1, 2>> = <<5, 6>>))] EXCEPT !.a = Head(SortSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
