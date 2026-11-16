(*---
description: Evaluates a random record expression, seed 262, number 3879.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03879 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT !.a = @ + LET b6111 == 0 IN b6111] EXCEPT !.a = LET b6112 == (--1) IN Head(<<1, 2>>)] EXCEPT !.a = @ + CASE (LET b6113 == 1 IN b6113 = (3 + 2)) -> Head(SortSeq(<<1>>, LAMBDA p, q : p < q)) [] OTHER -> IF (<<1, 2>> = <<5, 6>>) THEN ([a |-> 1, b |-> TRUE] + 7) ELSE LET b6114 == 2 IN 3])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 121 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 118.
    | Expression starting at line 14, column 118.
    | Definition starting at line 14, column 109.
    | Let Definitions starting at line 14, column 109.
    | Case Other Arm starting at line 14, column 105.
    | Fatal errors while parsing TLA+ spec in file random_03879
    | In module random_03879
    | Could not parse module random_03879 from file random_03879.tla
    | *** Errors: 1
    | In module random_03879
    | Could not parse module random_03879 from file random_03879.tla
    3002:1 Parsing or semantic analysis failed.
---*)
