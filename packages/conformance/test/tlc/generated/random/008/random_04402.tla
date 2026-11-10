(*---
description: Evaluates a random set expression, seed 262, number 4402.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04402 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b6924 == IF ([a |-> 1] = [a |-> 1]) THEN (7 % -1) ELSE (FALSE)[b6923] IN CASE (TRUE <=> FALSE) -> (b6924 % b6924) [] OTHER -> (CHOOSE b6925 \in Nat : [a |-> 1, b |-> TRUE]) : b6923 \in {((CHOOSE b6927 \in {x \in 1..3 : x > 1} : TRUE) + Len(<<1>>)) : b6926 \in UNION {DOMAIN <<5, 6>>, UNION {1..3, SUBSET {1}}}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04402 failed.
    Attempted to compare integer 1 with non-integer:
    {1}
---*)
