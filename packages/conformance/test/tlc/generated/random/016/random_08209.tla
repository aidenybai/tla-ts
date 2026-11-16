(*---
description: Evaluates a random int expression, seed 262, number 8209.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08209 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((-1 = [a |-> 1, b |-> TRUE]) => (TRUE \/ <<1, 2>>)) -> ((-2147483647) % (7 * [x \in Nat |-> x + 1])) [] OTHER -> (\E b12706 \in DOMAIN <<5, 6>> : (TRUE => FALSE)) \div (CHOOSE b12707 \in (({1} \cap 1..3) \ (2..1 \cup {1, 2})) : ((CHOOSE r \in [a : 1..2] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08209 failed.
    Attempted to check equality of integer -1 with non-integer:
    [a |-> 1, b |-> TRUE]
---*)
