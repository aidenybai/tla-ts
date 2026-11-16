(*---
description: Evaluates a random record expression, seed 262, number 2118.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02118 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(SubSeq([<<1>> EXCEPT ![1] = 2], ((1 :> 2))[-1], (7 % -1))) :> (IF (TRUE => TRUE) THEN ([a |-> 1]).a ELSE (-1 % 2147483647) \div LET b3363 == Len(<<>>) IN (-b3363))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02118 failed.
    Attempted to apply function:
    <<2>>
    to argument -1, which is not in the domain of the function.
---*)
