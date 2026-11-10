(*---
description: Evaluates a random set expression, seed 262, number 1884.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01884 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (TRUE <=> <<5, 6>>) -> (7 \div 2) [] OTHER -> Cardinality({1}) .. SelectSeq((<<1, 2>> \o <<>>), LAMBDA e : e > 0)) \cap {([b2961 \in Nat |-> b2961])[Len(<<>>)] : b2960 \in {IF TRUE THEN b2962 ELSE [a |-> 1] : b2962 \in {7 : b2963 \in 1..3}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01884 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 24 to line 14, col 40 of module random_01884
---*)
