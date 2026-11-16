(*---
description: Evaluates a random int expression, seed 262, number 9881.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09881 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((DOMAIN [x \in Nat |-> x + 1] \subseteq DOMAIN <<1>>) => (\A b15359 \in {b15360 \in {x \in 1..3 : x > 1} : FALSE} : (\E b15361 \in Nat : TRUE))) -> LET b15362 == Cardinality(({} \ {1})) IN IF (<<1>> <=> TRUE) THEN Cardinality(SUBSET {1}) ELSE (-<<3, 1, 2>>) [] OTHER -> (UNION {{2, [a |-> 1]}, ({1} \cup 1..3)} \ ({3 : b15363 \in {x \in 1..3 : x > 1}} \cup UNION {Nat, {2, 1, 3}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09881 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 23 to line 14, col 73 of module random_09881
---*)
