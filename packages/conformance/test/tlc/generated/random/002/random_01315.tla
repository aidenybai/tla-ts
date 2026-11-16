(*---
description: Evaluates a random record expression, seed 262, number 1315.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01315 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + IF (CASE TRUE -> -1 [] OTHER -> 7 = IF <<5, 6>> THEN -1 ELSE 2) THEN ((--1) - Len(<<>>)) ELSE ((3 + 7) - (3 - 0))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 139 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 136.
    | Expression starting at line 14, column 136.
    | ExtendableExpr starting at line 14, column 135.
    | Expression starting at line 14, column 135.
    | IF THEN ELSE starting at line 14, column 66.
    | Fatal errors while parsing TLA+ spec in file random_01315
    | In module random_01315
    | Could not parse module random_01315 from file random_01315.tla
    | *** Errors: 1
    | In module random_01315
    | Could not parse module random_01315 from file random_01315.tla
    3002:1 Parsing or semantic analysis failed.
---*)
