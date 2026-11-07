(*---
description: Evaluates a random bool expression, seed 262, number 1422.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01422 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + ((CHOOSE r \in [a : {1}] : TRUE)).a] = [[a |-> (0 * -1), b |-> ([a |-> 1] = [a |-> 1])] EXCEPT !.a = @ + CASE (\A b2269 \in {2, 1, 3} : FALSE) -> CASE TRUE -> 0 [] OTHER -> 0 [] OTHER -> LET b2270 == 0 IN b2270]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 126 to line 14, col 126 of module random_01422 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 124.
    | Expression starting at line 14, column 124.
    | ExtendableExpr starting at line 14, column 123.
    | Expression starting at line 14, column 123.
    | Field Value starting at line 14, column 117.
    | Fatal errors while parsing TLA+ spec in file random_01422
    | In module random_01422
    | Could not parse module random_01422 from file random_01422.tla
    | *** Errors: 1
    | In module random_01422
    | Could not parse module random_01422 from file random_01422.tla
    3002:1 Parsing or semantic analysis failed.
---*)
