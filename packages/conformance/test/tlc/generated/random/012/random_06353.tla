(*---
description: Evaluates a random int expression, seed 262, number 6353.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06353 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((Cardinality({2, 1, 3}) \in ({} \cup {1, 2})) \/ (Cardinality(<<1>>) \in {[a |-> 1, b |-> TRUE], 2147483647})) -> LET b9761 == ((2147483647 * 7) - (CHOOSE b9762 \in {} : FALSE)) IN ((0 * b9761) \div LET b9763 == b9761 IN 0) [] OTHER -> Head(SortSeq(Append(FALSE, -1), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06353 failed.
    2181:0 Attempted to compute cardinality of the value
    <<1>>
---*)
