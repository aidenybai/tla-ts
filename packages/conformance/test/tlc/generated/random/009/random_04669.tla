(*---
description: Evaluates a random record expression, seed 262, number 4669.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04669 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (LET b7297 == 0 IN b7297 % Len(<<1, 2>>)), b |-> ({3, 2147483647} \subseteq {2, 7})] EXCEPT !.a = (CHOOSE b7298 \in {b7299 \in (2 .. 2147483647) : (\A b7300 \in 1..3 : TRUE)} : ((TRUE /\ TRUE) <=> (TRUE => FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04669 failed.
    Attempted to construct a set with too many elements (>1000000).
---*)
