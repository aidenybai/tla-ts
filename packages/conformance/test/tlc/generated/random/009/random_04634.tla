(*---
description: Evaluates a random set expression, seed 262, number 4634.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04634 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<3, 1, 2>>) % (0 \div 3)) - ((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE))[(7 * 3)]) .. LET b7261 == ([[a |-> 1] EXCEPT !.a = 7]).a IN {b7262 \in ({1, 2} \ {x \in 1..3 : x > 1}) : (FALSE /\ FALSE)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
