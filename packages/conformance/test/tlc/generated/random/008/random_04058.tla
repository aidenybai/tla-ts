(*---
description: Evaluates a random seq expression, seed 262, number 4058.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04058 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([(UNION {2..1, {1, 2}} \ <<{1}, 7>>) EXCEPT ![1] = ((CHOOSE b6388 \in {1, 2} : FALSE) - Cardinality(1..3))], ([[[a |-> 1] EXCEPT !.a = 2] EXCEPT !.a = @ + LET b6389 == -1 IN b6389]).a, (-IF (<<3, 1, 2>> \subseteq SUBSET {1}) THEN Cardinality(2..1) ELSE Head(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04058 failed.
    Attempted to apply EXCEPT construct to the value {1, 2} \ <<{1}, 7>>.
---*)
