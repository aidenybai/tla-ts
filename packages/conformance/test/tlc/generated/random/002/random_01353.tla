(*---
description: Evaluates a random record expression, seed 262, number 1353.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01353 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b2156 \in {b2157 \in {-1, 1} : (b2157 = 1)} : ((CHOOSE f \in [{1, 2} -> {1}] : TRUE) /\ ({1, 2} \subseteq <<>>))), b |-> (\A b2158 \in DOMAIN (<<5, 6>> @@ [x \in 1..2 |-> x]) : (SubSeq(<<1>>, b2158, 0) = [b2159 \in {2, 1, 3} |-> 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01353 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 78 to line 14, col 141 of module random_01353
---*)
