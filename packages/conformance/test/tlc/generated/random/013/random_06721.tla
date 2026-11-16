(*---
description: Evaluates a random int expression, seed 262, number 6721.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06721 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b10303 \in ({IF FALSE THEN 2147483647 ELSE 2 : b10304 \in {b10305 : b10305 \in {2, 1, 3}}} \cap ((SUBSET {1} \ <<5, 6>>) \ {2, -1})) : (Head(SubSeq(<<3, 1, 2>>, [x \in Nat |-> x + 1], {x \in 1..3 : x > 1})) < Head(Tail(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06721 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
