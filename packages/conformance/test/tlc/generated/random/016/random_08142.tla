(*---
description: Evaluates a random bool expression, seed 262, number 8142.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08142 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b12583 \in DOMAIN [b12584 \in ({2, 1, 3} \ {x \in 1..3 : x > 1}) |-> (b12584 \div b12584)] : (\E b12585 \in {b12586 \in [[a |-> 1] EXCEPT !.a = @ + b12583] : (Nat \subseteq {2, 1, 3})} : (\A b12587 \in {b12588 : b12588 \in Nat} : (\A b12589 \in 2..1 : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08142 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    [a |-> 2]
    is not enumerable
---*)
