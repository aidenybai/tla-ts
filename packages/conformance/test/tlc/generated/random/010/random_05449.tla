(*---
description: Evaluates a random set expression, seed 262, number 5449.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05449 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE) @@ [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 7]))[(CHOOSE b8439 \in UNION {SUBSET {1}, {1}} : (FALSE /\ TRUE))], (LET b8440 == Head(<<3, 1, 2>>) IN (b8440 * b8440) < Cardinality({b8441 : b8441 \in Nat}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
