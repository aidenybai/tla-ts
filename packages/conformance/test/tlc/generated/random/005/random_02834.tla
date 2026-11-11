(*---
description: Evaluates a random record expression, seed 262, number 2834.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02834 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF (2 < -1) THEN Cardinality(2..1) ELSE IF TRUE THEN 2147483647 ELSE 1, b |-> (Len(<<1>>) .. (<<5, 6>>)[-1])] EXCEPT !.a = Head((Append(<<>>, 0) \o SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02834 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
