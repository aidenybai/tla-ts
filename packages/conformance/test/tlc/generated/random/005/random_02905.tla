(*---
description: Evaluates a random set expression, seed 262, number 2905.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02905 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (<<b4596, -1>> => ({2, 1, 3} = Nat)) THEN (IF TRUE THEN b4596 ELSE b4596 \div [b4597 \in Nat |-> 2]) ELSE (\E b4598 \in (3 .. b4596) : (FALSE <=> TRUE)) : b4596 \in UNION {(UNION {{1}, {1, 2}} \cap ({x \in 1..3 : x > 1} \cup 1..3)), UNION {(2 = (1 :> 2)), (CHOOSE b4599 \in {} : b4599)}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02905 failed.
    Attempted to check equality of integer 2 with non-integer:
    <<2>>
---*)
