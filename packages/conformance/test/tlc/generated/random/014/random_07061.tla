(*---
description: Evaluates a random seq expression, seed 262, number 7061.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07061 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CASE (TRUE /\ FALSE) -> Cardinality(SUBSET {1}) [] OTHER -> LET b10841 == 2..1 IN b10841 + IF (<<5, 6>> @@ [x \in 1..2 |-> x]) THEN Cardinality(SUBSET {1}) ELSE LET b10842 == 7 IN b10842), IF ((2147483647 \in {1, 2}) => (~FALSE)) THEN ((2147483647 + 1) + (3 \div 2)) ELSE ([a |-> 2147483647, b |-> FALSE]).a>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07061 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as the condition of an IF.
    line 14, col 110 to line 14, col 204 of module random_07061
---*)
