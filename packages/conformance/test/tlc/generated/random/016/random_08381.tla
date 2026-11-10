(*---
description: Evaluates a random seq expression, seed 262, number 8381.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08381 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SelectSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), Head([[x \in 1..2 |-> x] EXCEPT ![1] = 7])) EXCEPT ![1] = (CHOOSE b12964 \in DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE) : (({} \ [a |-> 1]) = [b12965 \in SUBSET {1} |-> 2]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08381 failed.
    Attempted to check equality of the set {} with the value:
    ({} :> 2 @@ {1} :> 2)
---*)
