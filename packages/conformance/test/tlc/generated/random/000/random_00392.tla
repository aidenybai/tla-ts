(*---
description: Evaluates a random seq expression, seed 262, number 392.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00392 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([((<<1>> \o <<>>) \o SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) EXCEPT ![1] = Len(<<-1, 2>>)], Head(([TRUE EXCEPT ![1] = 2147483647] \o SelectSeq(<<>>, LAMBDA e : e > 0))), (CHOOSE b645 \in (LET b646 == 3 IN 3 .. IF TRUE THEN -1 ELSE 7) : ([a |-> 1, b |-> TRUE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = (1 :> 2)]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00392 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
