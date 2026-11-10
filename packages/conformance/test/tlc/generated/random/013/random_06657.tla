(*---
description: Evaluates a random function expression, seed 262, number 6657.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06657 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [2..1 -> {1, 2}] : TRUE) EXCEPT ![(CHOOSE b10213 \in ({2, 1, 3} \ 2..1) : (3 \in <<1, 2>>))] = (-(0 - <<3, 1, 2>>))] EXCEPT ![((Head(<<1, 2>>) + CASE FALSE -> 0 [] OTHER -> 3) - SubSeq((<<1>> \o 0), (3 \div 3), CASE FALSE -> 3 [] OTHER -> 2))] = (((<<5, 6>>)[7] % (CHOOSE b10214 \in 2..1 : {2, 1, 3})) + (-Cardinality(Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06657 failed.
    Attempted to check set membership in a tuple value.
---*)
