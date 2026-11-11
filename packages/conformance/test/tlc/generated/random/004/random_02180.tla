(*---
description: Evaluates a random int expression, seed 262, number 2180.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02180 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (SelectSeq((<<1>> \o <<1>>), LAMBDA e : e > 0) = ([b3438 \in {2, 1, 3} |-> -1] @@ [[a |-> 1] EXCEPT !.a = @ + 3])) THEN IF (UNION {{1, 2}, {x \in 1..3 : x > 1}} \subseteq (1..3 \cap {2, 1, 3})) THEN Head(Append([a |-> 1], 2147483647)) ELSE ((CHOOSE b3439 \in {1, 2} : <<1, 2>>) - IF FALSE THEN -1 ELSE 0) ELSE Len(SelectSeq(SubSeq(<<1>>, 2, TRUE), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02180 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
---*)
