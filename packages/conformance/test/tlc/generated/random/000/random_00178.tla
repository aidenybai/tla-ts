(*---
description: Evaluates a random record expression, seed 262, number 178.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00178 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b284 \in ((2 + -1) .. (-1 * -1)) : ([[a |-> 1] EXCEPT !.a = b284] \subseteq {b284, b284})), b |-> (\E b285 \in UNION {{0, 7}, ({1, 2} \cup {2, 1, 3})} : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] = [a |-> b285, b |-> TRUE]))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 57 to line 14, col 57 of module random_00178 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 55.
    | Expression starting at line 14, column 54.
    | ExtendableExpr starting at line 14, column 53.
    | ExtendableExpr starting at line 14, column 41.
    | Expression starting at line 14, column 41.
    | Fatal errors while parsing TLA+ spec in file random_00178
    | In module random_00178
    | Could not parse module random_00178 from file random_00178.tla
    | *** Errors: 1
    | In module random_00178
    | Could not parse module random_00178 from file random_00178.tla
    3002:1 Parsing or semantic analysis failed.
---*)
