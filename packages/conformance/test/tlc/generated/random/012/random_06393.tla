(*---
description: Evaluates a random function expression, seed 262, number 6393.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06393 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[([a |-> 1] @@ <<5, 6>>) EXCEPT ![LET b9830 == [a |-> 1] IN -1] = ((1 :> 2))[2]] EXCEPT ![[b9831 \in {b9832 : b9832 \in 1..3} |-> (3 \div 7)]] = Head(SubSeq(<<3, 1, 2>>, 2, 1))] EXCEPT ![(Len((<<>> \o <<>>)) - (IF TRUE THEN 2 ELSE -1 + (3 + 2147483647)))] = ((CHOOSE b9833 \in {b9834 : b9834 \in {}} : (\A b9835 \in {} : FALSE)) .. ((-3) * (-3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06393 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
