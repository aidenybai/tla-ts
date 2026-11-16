(*---
description: Evaluates a random bool expression, seed 262, number 2478.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02478 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF ({2, 1, 3} \subseteq {1, 2}) THEN (-3) ELSE Cardinality(2..1) .. (CHOOSE b3897 \in DOMAIN <<5, 6>> : (~FALSE))) = {b3898 \in UNION {(2..1 \ 2), {1, 0}} : ({0, b3898} /\ ({1, 2} = {2, 1, 3}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02478 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 176 to line 14, col 209 of module random_02478
---*)
