(*---
description: Evaluates a random record expression, seed 262, number 5621.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05621 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(([[a |-> 1] EXCEPT !.a = @ + 3] :> (1 * 1)))[(CASE TRUE -> 3 [] OTHER -> 2 % LET b8694 == 3 IN b8694)] EXCEPT !.a = ((CHOOSE f \in [{1, 2} -> {1}] : TRUE))[CASE (FALSE /\ TRUE) -> (-2) [] OTHER -> CASE TRUE -> 3 [] OTHER -> -1]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05621 failed.
    Attempted to check equality of record:
    [a |-> 4]
    with non-record
    3
---*)
