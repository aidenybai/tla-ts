(*---
description: Evaluates a random record expression, seed 262, number 959.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00959 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-((-2) \div ([a |-> 1, b |-> TRUE]).a)), b |-> (\E b1548 \in ({b1549 : b1549 \in {1}} \cup [a |-> 2, b |-> FALSE]) : ({2, [x \in 1..2 |-> x]} = Cardinality(Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00959 failed.
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    [a |-> 2, b |-> FALSE]
    are not both enumerable
---*)
