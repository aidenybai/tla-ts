(*---
description: Evaluates a random seq expression, seed 262, number 5571.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05571 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SelectSeq([<<1>> EXCEPT ![1] = -1], LAMBDA e : e > 0) \o SubSeq(<<0, 1>>, CASE FALSE -> -1 [] OTHER -> 2147483647, IF TRUE THEN 2 ELSE [x \in Nat |-> x + 1])), ((<<1, 2>> @@ ((1 :> 2) @@ (1 :> 2))))[([[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 3])[SelectSeq(<<1>>, LAMBDA e : e > 0)]], (\E b8621 \in CASE (TRUE <=> TRUE) -> SubSeq(<<1, 2>>, 1, 2) [] OTHER -> (TRUE).a : ((CHOOSE b8622 \in {1} : TRUE) < (b8621 % b8621)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05571 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
