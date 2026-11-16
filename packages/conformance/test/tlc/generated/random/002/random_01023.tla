(*---
description: Evaluates a random function expression, seed 262, number 1023.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01023 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1649 \in {Len([<<1, 2>> EXCEPT ![1] = b1650]) : b1650 \in (UNION {{x \in 1..3 : x > 1}, SUBSET {1}} \cup [[a |-> 1, b |-> TRUE] EXCEPT !.a = 1])} |-> ((IF FALSE THEN 7 ELSE b1649 * (CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE)) + Head(Tail(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01023 failed.
    Attempted to compare the set {} with the value:
    2
---*)
