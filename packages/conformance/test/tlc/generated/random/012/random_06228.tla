(*---
description: Evaluates a random set expression, seed 262, number 6228.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06228 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9585 \in {(LET b9586 == 2 IN -1 \div IF FALSE THEN 2 ELSE 2), IF (1..3 \subseteq {x \in 1..3 : x > 1}) THEN ([a |-> 1, b |-> TRUE]).a ELSE IF TRUE THEN 0 ELSE 2147483647} : (\A b9587 \in DOMAIN <<7, b9585>> : (\A b9588 \in {{2, 1, 3}, b9585} : (FALSE => FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06228 failed.
    Attempted to compare integer 0 with non-integer:
    {1, 2, 3}
---*)
