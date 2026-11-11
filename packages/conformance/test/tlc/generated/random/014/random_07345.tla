(*---
description: Evaluates a random record expression, seed 262, number 7345.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07345 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Len(<<1>>), b |-> (FALSE \/ <<>>)] EXCEPT !.a = @ + Cardinality(UNION {{2, 1, 3}, {2, 1, 3}})] EXCEPT !.a = Len(Append(SubSeq(<<>>, 7, 1), IF TRUE THEN 1 ELSE 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07345 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a tuple.
    line 14, col 44 to line 14, col 56 of module random_07345
---*)
