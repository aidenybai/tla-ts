(*---
description: Evaluates a random set expression, seed 262, number 2322.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02322 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Cardinality({b3676 : b3677 \in {x \in 1..3 : x > 1}}) : b3676 \in ((CHOOSE b3678 \in {1} : TRUE) .. (3 * 0))} \cap (UNION {{b3679 : b3679 \in SUBSET {1}}, (1 .. 1)} \cap {(2147483647 + 2), (<<5, 6>>)[2]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2
    2178:0 Overflow when computing 2147483647+2
---*)
