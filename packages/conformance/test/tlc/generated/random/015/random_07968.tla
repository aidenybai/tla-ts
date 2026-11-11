(*---
description: Evaluates a random int expression, seed 262, number 7968.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07968 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-CASE SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) -> (CHOOSE b12303 \in {} : TRUE) [] OTHER -> Cardinality({})) + Len(Append((<<1, 2>> \o <<>>), LET b12304 == 0 IN 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07968 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 24 to line 14, col 63 of module random_07968
---*)
