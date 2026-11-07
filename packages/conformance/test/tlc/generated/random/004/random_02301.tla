(*---
description: Evaluates a random set expression, seed 262, number 2301.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02301 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 1, b |-> FALSE] EXCEPT !.a = (CHOOSE b3633 \in SUBSET {1} : 0)]).a .. ((CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE) @@ [b3634 \in UNION {{}, FALSE} |-> (-b3634)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 56 to line 14, col 86 of module random_02301
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 56 to line 14, col 86 of module random_02301
---*)
