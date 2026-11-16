(*---
description: Evaluates a random function expression, seed 262, number 8701.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08701 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b13467 == (FALSE * 3) IN (CHOOSE b13468 \in {1} : TRUE) * LET b13469 == LET b13470 == 1 IN 3 IN (--1)) :> Len([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = LET b13471 == 0 IN 1])))
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
    | Case Other Arm starting at line 14, column 80.
    | ExtendableExpr starting at line 14, column 47.
    | Expression starting at line 14, column 47.
    | Fatal errors while parsing TLA+ spec in file random_08701
    | In module random_08701
    | Could not parse module random_08701 from file random_08701.tla
    | *** Errors: 1
    | In module random_08701
    | Could not parse module random_08701 from file random_08701.tla
    3002:1 Parsing or semantic analysis failed.
---*)
