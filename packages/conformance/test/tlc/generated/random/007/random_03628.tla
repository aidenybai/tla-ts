(*---
description: Evaluates a random int expression, seed 262, number 3628.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03628 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b5733 \in ((({} /\ TRUE) \/ (\E b5734 \in {2, 1, 3} : FALSE)) \cup ((Nat \cap [a |-> 1]) \cap DOMAIN <<5, 6>>)) : (Len(SubSeq(<<>>, b5733, {})) \/ ((-b5733) < (7 \div 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03628 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 37 to line 14, col 46 of module random_03628
---*)
