(*---
description: Evaluates a random function expression, seed 262, number 7654.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07654 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE) EXCEPT ![CASE (TRUE /\ FALSE) -> Len(<<>>) [] OTHER -> LET b11782 == -1 IN b11782] = ((7 % 2) \div (3 * 3))] EXCEPT ![LET b11783 == ((<<5, 6>>)[7] % CASE FALSE -> 3 [] OTHER -> -1) IN (Head(<<>>) % (1 - 0))] = [[a |-> [[x \in Nat |-> x + 1] EXCEPT ![-1] = 2], b |-> ({} = {})] EXCEPT !.a = @ + ({<<3, 1, 2>>, 0} \ ({2, 1, 3} \cap {1}))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 59 of module random_07654
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07654 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
