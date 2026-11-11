(*---
description: Evaluates a random set expression, seed 262, number 4503.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04503 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CASE ([a |-> 1] /\ FALSE) -> (-b7073) [] OTHER -> (b7073 - FALSE) - (CHOOSE b7074 \in (<<1>> \ Nat) : (<<3, 1, 2>> = [x \in Nat |-> x + 1]))) : b7073 \in (({b7075 \in SUBSET {1} : FALSE} \ (1..3 \cap 1..3)) \cup <<CASE FALSE -> 7 [] OTHER -> -1, Cardinality(SUBSET {1})>>)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04503 failed.
    Attempted to enumerate S \cup T when S:
    {}
    and T:
    <<-1, 2>>
    are not both enumerable
---*)
