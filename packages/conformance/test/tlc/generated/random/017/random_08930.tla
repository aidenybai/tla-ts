(*---
description: Evaluates a random int expression, seed 262, number 8930.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08930 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((LET b13847 == 0 IN b13847 = (CHOOSE b13848 \in SUBSET {1} : TRUE)) => (\A b13849 \in (7 .. 7) : (TRUE /\ TRUE))) THEN Head([(<<3, 1, 2>> \o <<1, 2>>) EXCEPT ![1] = Len(<<3, 1, 2>>)]) ELSE (LET b13850 == ([x \in Nat |-> x + 1])[3] IN Head(<<3, 1, 2>>) \div (Head(<<1, 2>>) % (7 % 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08930 failed.
    Attempted to check equality of integer 0 with non-integer:
    {}
---*)
