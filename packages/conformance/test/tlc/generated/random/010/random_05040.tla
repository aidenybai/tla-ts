(*---
description: Evaluates a random seq expression, seed 262, number 5040.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05040 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<(Head(<<>>) + (<<5, 6>>)[1]), ((2147483647 % <<1, 2>>) \div LET b7835 == 2 IN b7835)>>, ([(CHOOSE f \in [{1, 2} -> 2..1] : TRUE) EXCEPT ![(-1)] = [a |-> 3, b |-> FALSE]])[Cardinality(UNION {{2, 1, 3}, SUBSET {1}})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
