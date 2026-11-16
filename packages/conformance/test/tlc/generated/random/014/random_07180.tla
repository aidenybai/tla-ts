(*---
description: Evaluates a random seq expression, seed 262, number 7180.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07180 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(<<Cardinality({x \in 1..3 : x > 1}), LET b11026 == 1 IN b11026>>, LAMBDA p, q : p < q), CASE Append(SubSeq(<<>>, 3, 2147483647), IF TRUE THEN 3 ELSE 2147483647) -> Cardinality({0, 2}) [] OTHER -> LET b11027 == CASE FALSE -> 2147483647 [] OTHER -> 3 IN Cardinality(2..1), (LET b11028 == (--1) IN LET b11029 == 0 IN b11028 - (Len(<<1, 2>>) \div IF TRUE THEN 2 ELSE 1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 320 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 317.
    | Expression starting at line 14, column 317.
    | Definition starting at line 14, column 307.
    | Let Definitions starting at line 14, column 307.
    | Case Other Arm starting at line 14, column 303.
    | Fatal errors while parsing TLA+ spec in file random_07180
    | In module random_07180
    | Could not parse module random_07180 from file random_07180.tla
    | *** Errors: 1
    | In module random_07180
    | Could not parse module random_07180 from file random_07180.tla
    3002:1 Parsing or semantic analysis failed.
---*)
