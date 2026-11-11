(*---
description: Evaluates a random set expression, seed 262, number 2344.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02344 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([(CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE) EXCEPT ![([a |-> 1, b |-> TRUE]).a] = Cardinality({x \in 1..3 : x > 1})])[((CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE))[Len(<<>>)]], ({(2147483647 % 7), ([a |-> 1]).a} \cup (IF FALSE THEN 0 ELSE [a |-> 1] .. (CHOOSE b3718 \in {1} : FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02344 failed.
    Attempted to apply function:
    <<2, 2, 2>>
    to argument 0, which is not in the domain of the function.
---*)
