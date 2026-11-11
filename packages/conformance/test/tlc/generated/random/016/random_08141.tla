(*---
description: Evaluates a random set expression, seed 262, number 8141.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08141 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(\E b12578 \in {b12579 \in (1 :> 3) : (\E b12580 \in {1, 2} : TRUE)} : (DOMAIN <<1, 2>> = {-1 : b12581 \in SUBSET {1}})), (((0 * 1) \div ([a |-> 1]).a) * (-(CHOOSE b12582 \in {} : TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08141 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    <<3>>
    is not enumerable
---*)
