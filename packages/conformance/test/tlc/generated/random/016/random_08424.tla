(*---
description: Evaluates a random record expression, seed 262, number 8424.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08424 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b13040 == (((CHOOSE f \in [{} -> {}] : TRUE) @@ [(1 :> 2) EXCEPT ![1] = [a |-> 1]]))[[[a |-> FALSE, b |-> TRUE] EXCEPT !.a = (7 \div 3)]] IN LET b13041 == CASE (TRUE < b13040) -> CASE FALSE -> b13040 [] OTHER -> -1 [] OTHER -> (b13040 - b13040) IN (CHOOSE b13042 \in (b13040 .. 0) : (FALSE /\ TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08424 failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 2, b |-> TRUE]
---*)
