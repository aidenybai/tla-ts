(*---
description: Evaluates a random set expression, seed 262, number 46.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00046 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b63 \in (({b64 \in SUBSET {1} : TRUE} \cap (1..3 \ {x \in 1..3 : x > 1})) \ ({1, 2} \cap (0 .. 3))) : ((CHOOSE b65 \in UNION {{x \in 1..3 : x > 1}, {2, 1, 3}} : (\A b66 \in Nat : TRUE)) < ((-1 - b63) :> (b63 - 2)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00046 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
