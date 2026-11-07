(*---
description: Evaluates a random seq expression, seed 262, number 1415.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01415 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0), CASE (\A b2251 \in {} : TRUE) -> [b2252 \in {1} |-> b2252] [] OTHER -> (2 \div 3)) EXCEPT ![1] = ((CHOOSE b2253 \in (1 :> 2) : (\E b2254 \in {1, 2} : FALSE)) % Cardinality(DOMAIN (1 :> 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01415 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 187 to line 14, col 243 of module random_01415
---*)
