(*---
description: Evaluates a random bool expression, seed 262, number 4248.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04248 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) \div (SortSeq(<<>>, LAMBDA p, q : p < q)).a) = ((((1 :> 2) @@ <<5, 6>>) @@ ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])))[Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04248 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
