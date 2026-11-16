(*---
description: Evaluates a random set expression, seed 262, number 8679.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08679 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE b13435 \in 1..3 : TRUE) - (CHOOSE b13436 \in 1..3 : FALSE)) - LET b13437 == (b13434 * [a |-> 1]) IN IF FALSE THEN b13437 ELSE 2) : b13434 \in (((~TRUE) % (CHOOSE b13438 \in [a |-> 1, b |-> TRUE] : FALSE)) .. (CASE TRUE -> -1 [] OTHER -> -1 - (--1)))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 272 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 269.
    | ExtendableExpr starting at line 14, column 265.
    | Expression starting at line 14, column 264.
    | Case Other Arm starting at line 14, column 255.
    | CASE Expression starting at line 14, column 236.
    | Fatal errors while parsing TLA+ spec in file random_08679
    | In module random_08679
    | Could not parse module random_08679 from file random_08679.tla
    | *** Errors: 1
    | In module random_08679
    | Could not parse module random_08679 from file random_08679.tla
    3002:1 Parsing or semantic analysis failed.
---*)
