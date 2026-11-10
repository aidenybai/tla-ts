(*---
description: Evaluates a random seq expression, seed 262, number 7693.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07693 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([b11847 \in ({2, 1, 3} \cap {1, 2}) |-> LET b11848 == 2 IN b11848])[((CHOOSE f \in [2..1 -> {1, 2}] : TRUE))[([a |-> 1, b |-> TRUE]).a]], CASE (([x \in Nat |-> x + 1])[7] \in (2 .. 2147483647)) -> Cardinality((2147483647 .. [a |-> 1, b |-> TRUE])) [] OTHER -> ((2147483647 * 3) \div LET b11849 == 2 IN 3)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07693 failed.
    Attempted to apply function:
    <<>>
    to argument 1, which is not in the domain of the function.
---*)
