(*---
description: Evaluates a random record expression, seed 262, number 3670.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03670 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> [b5798 \in {b5799 \in {x \in 1..3 : x > 1} : TRUE} |-> (CHOOSE b5800 \in SUBSET {1} : FALSE)], b |-> ((0 * 7) < (0 * -1))] EXCEPT !.a = (((2 \div (1 :> 2)) :> ((1 :> 2))[3]))[((7 - 3) - CASE TRUE -> 1 [] OTHER -> -1)]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 139 to line 14, col 139 of module random_03670 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 137.
    | Expression starting at line 14, column 137.
    | ExtendableExpr starting at line 14, column 136.
    | ExtendableExpr starting at line 14, column 126.
    | Expression starting at line 14, column 126.
    | Fatal errors while parsing TLA+ spec in file random_03670
    | In module random_03670
    | Could not parse module random_03670 from file random_03670.tla
    | *** Errors: 1
    | In module random_03670
    | Could not parse module random_03670 from file random_03670.tla
    3002:1 Parsing or semantic analysis failed.
---*)
