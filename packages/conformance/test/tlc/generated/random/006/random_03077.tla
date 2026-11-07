(*---
description: Evaluates a random bool expression, seed 262, number 3077.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03077 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b4886 \in {b4887 \in {b4888 \in (SUBSET {1} \ Nat) : (TRUE <=> TRUE)} : [[[a |-> 1, b |-> TRUE] EXCEPT !.a = b4887] EXCEPT !.a = (0 \div b4887)]} : [a |-> IF (b4886 < b4886) THEN Cardinality({2, 1, 3}) ELSE LET b4889 == -1 IN b4889, b |-> {Len(<<3, 1, 2>>) : b4890 \in {b4886 : b4891 \in [a |-> 1]}}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)
