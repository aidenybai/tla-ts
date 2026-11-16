(*---
description: Evaluates a random record expression, seed 262, number 8278.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08278 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality({b12820 \in SUBSET {1} : FALSE}) \div CASE (Nat \subseteq 2..1) -> Head(<<>>) [] OTHER -> (2 + -1)) * Len(Append((<<1>> = [x \in Nat |-> x + 1]), IF FALSE THEN 3 ELSE 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08278 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 74 to line 14, col 91 of module random_08278
---*)
