(*---
description: Evaluates a random function expression, seed 262, number 8015.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08015 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b12365 \in ({7, 7} \cup {2, <<1>>}) |-> Cardinality(UNION {{1, 2}, {1, 2}})] EXCEPT ![Len(SortSeq(Tail(<<1>>), LAMBDA p, q : p < q))] = ((CHOOSE r \in [a : 1..2] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08015 failed.
    Attempted to compare the function <<1>> with the value:
    2
---*)
