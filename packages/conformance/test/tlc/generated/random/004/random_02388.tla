(*---
description: Evaluates a random record expression, seed 262, number 2388.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02388 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Cardinality({1}), b |-> (\A b3787 \in SUBSET {1} : TRUE)] EXCEPT !.a = @ + Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))] EXCEPT !.a = ([SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = LET b3788 == 1 IN 3] /\ (({1, 2} = Nat) <=> (-1 \in 2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02388 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a tuple.
    line 14, col 161 to line 14, col 275 of module random_02388
---*)
