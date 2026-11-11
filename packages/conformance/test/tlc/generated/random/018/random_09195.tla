(*---
description: Evaluates a random function expression, seed 262, number 9195.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09195 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([(CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE) EXCEPT ![Cardinality({x \in 1..3 : x > 1})] = Len(7)] @@ ([a |-> 2, b |-> TRUE] :> (2 + 1))) EXCEPT ![{Cardinality(DOMAIN [x \in 1..2 |-> x]) : b14266 \in {CASE FALSE -> 1 [] OTHER -> b14267 : b14267 \in (1..3 \cap {})}}] = ([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = (CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 59 of module random_09195
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09195 failed.
    Attempted to check equality of record:
    [a |-> 2, b |-> TRUE]
    with non-record
    {}
---*)
