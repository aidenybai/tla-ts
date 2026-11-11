(*---
description: Evaluates a random seq expression, seed 262, number 7327.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07327 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b11274 \in {Len(Tail(<<1, 2>>)) : b11275 \in {LET b11277 == b11276 IN 1 : b11276 \in ([a |-> 1] \cup {x \in 1..3 : x > 1})}} : (~(~(TRUE <=> TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07327 failed.
    Attempted to enumerate S \cup T when S:
    {2, 3}
    and T:
    [a |-> 1]
    are not both enumerable
---*)
