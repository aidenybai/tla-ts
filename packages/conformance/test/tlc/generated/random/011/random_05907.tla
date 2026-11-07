(*---
description: Evaluates a random seq expression, seed 262, number 5907.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05907 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (([a |-> 7, b |-> TRUE]).a = IF (0 = 7) THEN IF TRUE THEN 2 ELSE -1 ELSE [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]) -> CASE (SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) = (CHOOSE f \in [{1} -> {1, 2}] : TRUE)) -> (CHOOSE b9114 \in DOMAIN [x \in 1..2 |-> x] : (TRUE /\ TRUE)) [] OTHER -> ((CHOOSE b9115 \in {1, 2} : <<1>>) \in DOMAIN [x \in Nat |-> x + 1]) [] OTHER -> (IF (2..1 \subseteq {1}) THEN Cardinality({1, 2}) ELSE (1 * 7) - Head(Append(<<3, 1, 2>>, 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05907 failed.
    Attempted to check equality of integer 7 with non-integer:
    [a |-> 1, b |-> TRUE]
---*)
