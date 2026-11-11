(*---
description: Evaluates a random set expression, seed 262, number 2360.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02360 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE))[(([a |-> 1, b |-> TRUE]).a * (--1))], IF (\E b3740 \in (7 .. <<3, 1, 2>>) : (TRUE <=> FALSE)) THEN (LET b3741 == 0 IN b3741 + (2 * 1)) ELSE Head(SortSeq(<<1>>, LAMBDA p, q : p < q))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 98 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 95.
    | ExtendableExpr starting at line 14, column 67.
    | Expression starting at line 14, column 67.
    | ExtendableExpr starting at line 14, column 66.
    | Expression starting at line 14, column 66.
    | Fatal errors while parsing TLA+ spec in file random_02360
    | In module random_02360
    | Could not parse module random_02360 from file random_02360.tla
    | *** Errors: 1
    | In module random_02360
    | Could not parse module random_02360 from file random_02360.tla
    3002:1 Parsing or semantic analysis failed.
---*)
