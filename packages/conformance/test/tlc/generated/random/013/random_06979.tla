(*---
description: Evaluates a random int expression, seed 262, number 6979.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06979 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\E b10686 \in (LET b10687 == 1 IN b10687 \in {-1, 2147483647}) : ((SUBSET {1} = {2, 1, 3}) <=> (FALSE \/ TRUE))) THEN Cardinality({Len(<<1>>) : b10688 \in {2, 2}}) ELSE ((Len(<<3, 1, 2>>) * Head(<<>>)) \div [[a |-> <<3, 1, 2>>, b |-> TRUE] EXCEPT !.a = @ + (2 + 2147483647)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06979 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 35 to line 14, col 80 of module random_06979
---*)
