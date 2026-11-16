(*---
description: Evaluates a random set expression, seed 262, number 3403.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03403 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b5406 \in {b5407 \in {[[x \in Nat |-> x + 1] EXCEPT ![1] = b5408] : b5408 \in Tail(<<3, 1, 2>>)} : (~([a |-> 1] = [a |-> 1, b |-> TRUE]))} : (SortSeq(SortSeq(b5406, LAMBDA p, q : p < q), LAMBDA p, q : p < q) = ((FALSE + b5406) :> (b5406 * 2147483647)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03403 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1, 2>>.
    line 14, col 95 to line 14, col 111 of module random_03403
---*)
