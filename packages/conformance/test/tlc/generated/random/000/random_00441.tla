(*---
description: Evaluates a random record expression, seed 262, number 441.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00441 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((Head(<<3, 1, 2>>) * IF TRUE THEN 2 ELSE 2147483647) - (CHOOSE b717 \in (FALSE \cup {x \in 1..3 : x > 1}) : [a |-> 0, b |-> TRUE])), b |-> ((\A b718 \in DOMAIN [x \in 1..2 |-> x] : (\E b719 \in {2, 1, 3} : FALSE)) \/ (\E b720 \in ({} \cup {}) : (b720 < -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00441 failed.
    Attempted to enumerate S \cup T when S:
    {2, 3}
    and T:
    FALSE
    are not both enumerable
---*)
