(*---
description: Evaluates a random seq expression, seed 262, number 7609.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07609 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(SelectSeq([<<1, 2>> EXCEPT ![1] = -1], LAMBDA e : e > 0), LAMBDA e : e > 0) EXCEPT ![1] = IF (\A b11702 \in (<<1>> \cup Nat) : (<<>> /\ FALSE)) THEN LET b11703 == Cardinality(1..3) IN Head(<<1, 2>>) ELSE ((3 % 2147483647) * (CHOOSE b11704 \in 1..3 : FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07609 failed.
    Attempted to enumerate S \cup T when S:
    <<1>>
    and T:
    Nat
    are not both enumerable
---*)
