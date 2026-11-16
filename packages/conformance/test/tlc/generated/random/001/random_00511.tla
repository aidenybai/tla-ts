(*---
description: Evaluates a random function expression, seed 262, number 511.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00511 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b851 \in ({b852 : b852 \in {1}} \cup (3 .. 0)) |-> Head(<<1, 2>>)] EXCEPT ![((-LET b853 == 1 IN b853) + IF (0 /\ TRUE) THEN (1 + 3) ELSE IF TRUE THEN 0 ELSE 2147483647)] = (CHOOSE b854 \in ({[a |-> 1, b |-> TRUE] : b855 \in {}} \cap UNION {2..1, {1}}) : (Cardinality({1, 2}) < (b854 + b854)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00511 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    an integer.
    line 14, col 126 to line 14, col 134 of module random_00511
---*)
