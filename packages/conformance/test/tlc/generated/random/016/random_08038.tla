(*---
description: Evaluates a random record expression, seed 262, number 8038.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08038 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b12406 == ((7 % -1) + [[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]) IN (-([x \in 1..2 |-> x])[-1]), b |-> ((Cardinality(Nat) = Tail(<<3, 1, 2>>)) /\ (~(-1 = -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08038 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
