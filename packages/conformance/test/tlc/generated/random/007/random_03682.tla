(*---
description: Evaluates a random function expression, seed 262, number 3682.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03682 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5815 \in {Len(SubSeq(<<>>, b5816, b5816)) : b5816 \in ((<<5, 6>>)[0] .. IF FALSE THEN 1 ELSE 2147483647)} |-> (((1 \div 2147483647) :> Len([a |-> 1])))[((<<>> \div b5815) + LET b5817 == 2147483647 IN b5817)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03682 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
