(*---
description: Evaluates a random set expression, seed 262, number 6078.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06078 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({CASE (1 < 7) -> (FALSE /\ TRUE) [] OTHER -> IF FALSE THEN 3 ELSE 0, (Head(<<1>>) % IF Nat THEN 2147483647 ELSE 0)} = ((DOMAIN (1 :> 2) \ ({} \ Nat)) \cap [(CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE) EXCEPT ![Cardinality({2, 1, 3})] = (CHOOSE r \in [a : {1}] : TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06078 failed.
    A non-boolean expression (a special set constant) was used as the condition of an IF.
    line 14, col 101 to line 14, col 129 of module random_06078
---*)
