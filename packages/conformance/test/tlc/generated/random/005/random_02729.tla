(*---
description: Evaluates a random record expression, seed 262, number 2729.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02729 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b4306 == (7 % 3) IN (b4306 \div 2147483647), b |-> ((TRUE <=> FALSE) /\ (TRUE \/ FALSE))] EXCEPT !.a = Cardinality({(b4307 * [x \in 1..2 |-> x]) : b4307 \in (<<>> \o <<1>>)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02729 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1>>.
    line 14, col 186 to line 14, col 198 of module random_02729
---*)
