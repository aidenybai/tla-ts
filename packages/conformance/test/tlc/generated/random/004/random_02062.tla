(*---
description: Evaluates a random int expression, seed 262, number 2062.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02062 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b3280 == (((3 % 2) * LET b3281 == 7 IN 2147483647) - (\A b3282 \in (1..3 \ {2, 1, 3}) : (b3282 < b3282))) IN IF (\A b3283 \in {b3284 : b3284 \in SUBSET {1}} : ([a |-> 1] = [a |-> 1])) THEN Head(Tail([x \in Nat |-> x + 1])) ELSE ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02062 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Tail(tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
