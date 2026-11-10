(*---
description: Evaluates a random set expression, seed 262, number 9755.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09755 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b15143 == ((LET b15144 == 0 IN b15144 * (0 * -1)) - ((CHOOSE b15145 \in {2, 1, 3} : TRUE) - CASE TRUE -> -1 [] OTHER -> 2147483647)) IN ([[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = @ + Head(<<1, 2>>)]).a)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 63 to line 14, col 63 of module random_09755 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 61.
    | Expression starting at line 14, column 61.
    | ExtendableExpr starting at line 14, column 60.
    | ExtendableExpr starting at line 14, column 51.
    | Expression starting at line 14, column 51.
    | Fatal errors while parsing TLA+ spec in file random_09755
    | In module random_09755
    | Could not parse module random_09755 from file random_09755.tla
    | *** Errors: 1
    | In module random_09755
    | Could not parse module random_09755 from file random_09755.tla
    3002:1 Parsing or semantic analysis failed.
---*)
