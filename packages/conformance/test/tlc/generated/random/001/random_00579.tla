(*---
description: Evaluates a random seq expression, seed 262, number 579.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00579 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(-(CHOOSE b978 \in {3, [a |-> 1, b |-> TRUE]} : (TRUE /\ TRUE))), ([(<<5, 6>> @@ [x \in Nat |-> x + 1]) EXCEPT !.a = @ + LET b979 == 0 IN b979]).a>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00579 failed.
    Attempted to compare record:
    [a |-> 1, b |-> TRUE]
    with non-record
    3
---*)
