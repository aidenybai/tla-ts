(*---
description: Evaluates a random set expression, seed 262, number 739.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00739 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(Len(<<1>>) - CASE TRUE -> -1 [] OTHER -> b1214) : b1214 \in {{3, 2}, ([a |-> 1, b |-> TRUE]).a}} \cup (({b1215 : b1215 \in {}} \cup ({2, 1, 3} \ {1, 2})) \cap {(CHOOSE b1216 \in 1..3 : TRUE), LET b1217 == 2 IN b1217})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00739 failed.
    Attempted to compare integer 1 with non-integer:
    {2, 3}
---*)
